import { generateText, Output } from "ai";

import { extractionModel } from "../../../llms/client";
import type {
  CharacterStateFormValue,
  GroupedCharacterFormValue,
  ModifierTokenFormValue,
} from "../../../routes/_app/taxa/$id/edit/-characters/validation";
import { getFeature, listAllFeatureLabels } from "../features/service";
import type {
  CharacterInFeatureDTO,
  FeatureDetailDTO,
} from "../features/types";
import { listAllModifiers } from "../modifiers/service";
import { searchCategoricalSuggestions } from "../suggestions/service";
import { listAllTraitValuesByCharacters } from "../traits/service";

import { convertToSI } from "../units/conversion";
import { listUnitFamilies } from "../units/service";
import type { UnitDTO } from "../units/types";
import {
  type ExtractionGlossary,
  type PerFeatureGlossary,
  buildFeatureNarrowingSystemPrompt,
  buildFeatureNarrowingUserPrompt,
  buildFeatureRequestSystemPrompt,
  buildFeatureRequestUserPrompt,
  buildModifierAssignmentSystemPrompt,
  buildModifierAssignmentUserPrompt,
  buildModifierRequestSystemPrompt,
  buildModifierRequestUserPrompt,
  buildObservationSystemPrompt,
  buildObservationUserPrompt,
  buildStateExtractionSystemPrompt,
  buildStateExtractionUserPrompt,
  buildVerificationSystemPrompt,
  buildVerificationUserPrompt,
} from "./prompts";
import {
  type CharacterExtraction,
  type FeatureNarrowing,
  type GlossaryGap,
  type StateExtraction,
  type StructuredObservations,
  type UnmatchedEntry,
  featureNarrowingSchema,
  featureRequestSchema,
  modifierAssignmentResultSchema,
  modifierRequestSchema,
  stateExtractionSchema,
  structuredObservationsSchema,
  verificationSweepSchema,
} from "./schemas";

// ── Public API ──────────────────────────────────────────────────────

export type ExtractionOutput = {
  states: GroupedCharacterFormValue;
  unmatched: UnmatchedEntry[];
  glossaryGaps: GlossaryGap[];
};

export async function extractStates(
  descriptionText: string,
): Promise<ExtractionOutput> {
  console.log("[extraction] Starting 7-step extraction…");

  // ── Step 1: Structured observations (glossary-free) ───────────────
  console.log("[extraction] Step 1: parsing structured observations…");
  const { output: observations } = await generateText({
    model: extractionModel,
    temperature: 0,
    output: Output.object({ schema: structuredObservationsSchema }),
    system: buildObservationSystemPrompt(),
    prompt: buildObservationUserPrompt(descriptionText),
  });
  console.log(
    `[extraction] Step 1: ${observations.observations.length} structures observed`,
  );

  if (observations.observations.length === 0) {
    console.log("[extraction] No observations found, returning empty");
    return { states: [], unmatched: [], glossaryGaps: [] };
  }

  // ── Post-Step-1: sanitize observation values against raw text ─────
  // Step 1 can hallucinate words into observation values (e.g. generating
  // "grayish brown" when the description only says "yellowish brown").
  // Validate each observation value against the original description.
  sanitizeObservationValues(observations, descriptionText);

  // ── Step 2: Feature request (names only) ──────────────────────────
  console.log("[extraction] Loading feature labels…");
  const featureLabels = await listAllFeatureLabels();
  console.log(`[extraction] Loaded ${featureLabels.length} feature labels`);

  console.log("[extraction] Step 2: requesting relevant features…");
  const { output: featureRequest } = await generateText({
    model: extractionModel,
    temperature: 0,
    output: Output.object({ schema: featureRequestSchema }),
    system: buildFeatureRequestSystemPrompt(featureLabels),
    prompt: buildFeatureRequestUserPrompt(observations),
  });
  console.log(
    `[extraction] Step 2: requested ${featureRequest.requestedFeatureIds.length} features`,
  );

  if (featureRequest.requestedFeatureIds.length === 0) {
    return { states: [], unmatched: [], glossaryGaps: [] };
  }

  // ── Step 3: Feature narrowing (with descriptions) ─────────────────
  const requestedFeatures = featureLabels.filter((f) =>
    featureRequest.requestedFeatureIds.includes(f.id),
  );

  console.log("[extraction] Step 3: narrowing features with descriptions…");
  const { output: narrowing } = await generateText({
    model: extractionModel,
    temperature: 0,
    output: Output.object({ schema: featureNarrowingSchema }),
    system: buildFeatureNarrowingSystemPrompt(requestedFeatures),
    prompt: buildFeatureNarrowingUserPrompt(observations),
  });
  console.log(
    `[extraction] Step 3: narrowed to ${narrowing.selectedFeatureIds.length} features`,
  );

  if (narrowing.selectedFeatureIds.length === 0) {
    return { states: [], unmatched: [], glossaryGaps: [] };
  }

  // ── Load glossary for selected features ───────────────────────────
  const glossary = await loadGlossaryForFeatures(narrowing.selectedFeatureIds);

  // Build observation-to-feature mapping from Step 3 (sub-observation level)
  const obsByFeature = new Map<
    number,
    {
      structure: string;
      verbatimText: string;
      observations: { property: string; value: string; qualifiers: string[] }[];
    }[]
  >();
  for (const mapping of narrowing.observationToFeatures) {
    const obs = observations.observations[mapping.observationIndex];
    if (!obs) continue;
    // Filter to only the sub-observations assigned to this mapping
    const filteredSubObs =
      mapping.subObservationIndices.length > 0
        ? obs.observations.filter((_, i) =>
            mapping.subObservationIndices.includes(i),
          )
        : obs.observations;
    if (filteredSubObs.length === 0) continue;
    for (const featureId of mapping.featureIds) {
      let entries = obsByFeature.get(featureId);
      if (!entries) {
        entries = [];
        obsByFeature.set(featureId, entries);
      }
      entries.push({
        structure: obs.structure,
        verbatimText: obs.verbatimText,
        observations: filteredSubObs,
      });
    }
  }

  // ── Post-Step-3: auto-repair for orphaned sub-observations ────────
  // If Step 3 missed mapping sub-observations, re-run with only the orphans
  const orphanedObs = findOrphanedSubObservations(observations, narrowing);
  if (orphanedObs.length > 0) {
    console.log(
      `[extraction] Step 3 repair: ${orphanedObs.length} orphaned sub-observation groups detected, re-running narrowing…`,
    );

    // Build a synthetic StructuredObservations containing only the orphaned items
    const orphanedStructures = buildOrphanedObservations(
      observations,
      orphanedObs,
    );

    const { output: repairNarrowing } = await generateText({
      model: extractionModel,
      temperature: 0,
      output: Output.object({ schema: featureNarrowingSchema }),
      system: buildFeatureNarrowingSystemPrompt(requestedFeatures),
      prompt: buildFeatureNarrowingUserPrompt(orphanedStructures),
    });

    // Load any newly selected features not already in the glossary
    const existingFeatureIds = new Set(narrowing.selectedFeatureIds);
    const newFeatureIds = repairNarrowing.selectedFeatureIds.filter(
      (id) => !existingFeatureIds.has(id),
    );
    if (newFeatureIds.length > 0) {
      console.log(
        `[extraction] Step 3 repair: loading ${newFeatureIds.length} additional features…`,
      );
      const additionalGlossary = await loadGlossaryForFeatures(newFeatureIds);
      glossary.features.push(...additionalGlossary.features);
      for (const [k, v] of additionalGlossary.traitValuesByCharacter) {
        glossary.traitValuesByCharacter.set(k, v);
      }
    }

    // Merge repair mappings into obsByFeature using the orphaned indices
    // The repair narrowing uses indices relative to the orphaned structure,
    // so we need to remap them back to the original observation indices
    for (const mapping of repairNarrowing.observationToFeatures) {
      const orphanGroup = orphanedObs[mapping.observationIndex];
      if (!orphanGroup) continue;
      const origObs = observations.observations[orphanGroup.observationIndex]!;

      // Map repair sub-observation indices back to original indices
      const originalSubIndices = mapping.subObservationIndices.map(
        (repairIdx) => orphanGroup.subObservationIndices[repairIdx]!,
      );

      const filteredSubObs =
        originalSubIndices.length > 0
          ? origObs.observations.filter((_, i) =>
              originalSubIndices.includes(i),
            )
          : origObs.observations.filter((_, i) =>
              orphanGroup.subObservationIndices.includes(i),
            );

      if (filteredSubObs.length === 0) continue;

      for (const featureId of mapping.featureIds) {
        let entries = obsByFeature.get(featureId);
        if (!entries) {
          entries = [];
          obsByFeature.set(featureId, entries);
        }
        entries.push({
          structure: origObs.structure,
          verbatimText: origObs.verbatimText,
          observations: filteredSubObs,
        });
      }
    }

    console.log(
      `[extraction] Step 3 repair: merged, now ${obsByFeature.size} features have observations`,
    );
  }

  // ── Step 4: State extraction (per-feature, sequential) ────────────
  const featuresWithText = glossary.features.filter((f) =>
    obsByFeature.has(f.id),
  );
  console.log(
    `[extraction] Step 4: extracting ${featuresWithText.length} features…`,
  );

  const perFeatureResults: {
    feature: FeatureDetailDTO;
    result: StateExtraction;
  }[] = [];
  for (const feature of featuresWithText) {
    try {
      const res = await extractForFeature(
        feature,
        glossary,
        obsByFeature.get(feature.id)!,
      );
      perFeatureResults.push(res);
    } catch (err) {
      console.error(
        `[extraction]   Feature "${feature.label}" extraction failed:`,
        err,
      );
    }
  }
  console.log(
    `[extraction] Step 4: ${perFeatureResults.length}/${featuresWithText.length} features succeeded`,
  );

  // ── Post-Step-4: retry dropped features ───────────────────────────
  // If a feature was selected in Step 3 but produced zero characters,
  // re-run extraction with ALL observations — let the LLM filter.
  // This catches naming mismatches (e.g. "stem" observations vs "Stipe" feature)
  // and Step 3 misrouting (core properties sent to wrong feature).
  const coveredFeatureIds = new Set(
    perFeatureResults
      .filter((r) => r.result.characters.length > 0)
      .map((r) => r.feature.id),
  );
  const allObsForRetry = observations.observations.map((obs) => ({
    structure: obs.structure,
    verbatimText: obs.verbatimText,
    observations: obs.observations,
  }));
  for (const feature of glossary.features) {
    if (coveredFeatureIds.has(feature.id)) continue;

    console.log(
      `[extraction] Step 4 retry: "${feature.label}" had 0 characters, re-extracting with all ${allObsForRetry.length} observations…`,
    );
    try {
      const res = await extractForFeature(feature, glossary, allObsForRetry);
      if (res.result.characters.length > 0) {
        const existingIdx = perFeatureResults.findIndex(
          (r) => r.feature.id === feature.id,
        );
        if (existingIdx >= 0) {
          perFeatureResults[existingIdx] = res;
        } else {
          perFeatureResults.push(res);
        }
        console.log(
          `[extraction] Step 4 retry: "${feature.label}" recovered ${res.result.characters.length} characters`,
        );
        obsByFeature.set(feature.id, allObsForRetry);
      }
    } catch (err) {
      console.error(`[extraction]   Retry for "${feature.label}" failed:`, err);
    }
  }

  // ── Post-Step-4: prune hallucinated trait value selections ──────
  // The LLM may select trait values from the glossary (e.g. "Grayish brown")
  // even when those words don't appear in the description.
  pruneUngroundedTraitValues(perFeatureResults, descriptionText, glossary);

  // Collect all qualifiers from Step 4 for modifier resolution
  const allQualifiers = collectQualifiers(perFeatureResults);
  const reportedGaps: GlossaryGap[] = [];
  for (const { result } of perFeatureResults) {
    reportedGaps.push(...result.glossaryGaps);
  }

  // ── Steps 5–6: Modifier resolution ───────────────────────────────
  const allModifiers = await listAllModifiers();
  const modifierById = new Map(allModifiers.map((m) => [m.id, m]));

  if (allQualifiers.size > 0) {
    // Step 5: Request modifier groups
    const modifierGroups = deriveModifierGroups(allModifiers);
    console.log(
      `[extraction] Step 5: requesting modifier groups for ${allQualifiers.size} unique qualifiers…`,
    );
    const qualifierSummary = [...allQualifiers]
      .map((q) => `- "${q}"`)
      .join("\n");

    const { output: modRequest } = await generateText({
      model: extractionModel,
      temperature: 0,
      output: Output.object({ schema: modifierRequestSchema }),
      system: buildModifierRequestSystemPrompt(modifierGroups),
      prompt: buildModifierRequestUserPrompt(qualifierSummary),
    });
    console.log(
      `[extraction] Step 5: requested ${modRequest.requestedGroupIds.length} modifier groups`,
    );

    // Step 6: Assign modifiers
    if (modRequest.requestedGroupIds.length > 0) {
      const requestedGroupIds = new Set(modRequest.requestedGroupIds);
      const groupedModifiers = buildModifierGroupValues(
        allModifiers,
        requestedGroupIds,
      );

      const characterSummary = buildCharacterSummaryForModifiers(
        perFeatureResults,
        glossary,
      );

      console.log("[extraction] Step 6: assigning modifiers…");
      const { output: modAssignment } = await generateText({
        model: extractionModel,
        temperature: 0,
        output: Output.object({ schema: modifierAssignmentResultSchema }),
        system: buildModifierAssignmentSystemPrompt(groupedModifiers),
        prompt: buildModifierAssignmentUserPrompt(characterSummary),
      });
      console.log(
        `[extraction] Step 6: ${modAssignment.assignments.length} assignments`,
      );

      // Programmatic modifier recovery: match qualifiers the LLM missed
      // by normalizing text (strip articles like "the", "a", "an").
      recoverUnmatchedModifiers(modAssignment.assignments, allModifiers);

      // Apply modifier assignments back to per-feature results
      applyModifierAssignments(perFeatureResults, modAssignment.assignments);

      // Collect unmatched qualifiers as glossary gaps
      for (const assignment of modAssignment.assignments) {
        for (const q of assignment.unmatchedQualifiers) {
          reportedGaps.push({
            text: q,
            reason: "no matching modifier",
          });
        }
      }
    }
  }

  // ── Step 7: Verification sweep with repair loop ────────────────────
  const MAX_REPAIR_ROUNDS = 2;
  const finalGlossaryGaps: GlossaryGap[] = [...reportedGaps];
  let finalUnmatched: UnmatchedEntry[] = [];

  for (let round = 0; round <= MAX_REPAIR_ROUNDS; round++) {
    const roundLabel =
      round === 0
        ? "Step 7: verification sweep"
        : `Step 7: repair round ${round}`;
    console.log(`[extraction] ${roundLabel}…`);

    const {
      characterById: curCharById,
      traitValueById: curTvById,
      unitById: curUnitById,
    } = buildLookups(glossary);

    const curStates: GroupedCharacterFormValue = [];
    for (const { feature, result } of perFeatureResults) {
      const characters = hydrateCharacters(
        result.characters,
        feature,
        curCharById,
        curTvById,
        modifierById,
        curUnitById,
        glossary.traitValuesByCharacter,
        glossary,
      );
      if (characters.length > 0) {
        curStates.push({
          featureId: feature.id,
          featureLabel: feature.label,
          notes: "",
          characters,
        });
      }
    }

    const extractedSummary = buildExtractedSummary(curStates);
    const glossarySummary = glossary.features
      .map((f) => {
        const chars = f.characters
          .map((c) => `${c.label} (${c.type})`)
          .join(", ");
        return `- ${f.label} (id: ${f.id}) → ${chars}`;
      })
      .join("\n");
    const gapsSummary =
      finalGlossaryGaps.length > 0
        ? finalGlossaryGaps.map((g) => `- "${g.text}": ${g.reason}`).join("\n")
        : "";

    const { output: sweepResult } = await generateText({
      model: extractionModel,
      temperature: 0,
      output: Output.object({ schema: verificationSweepSchema }),
      system: buildVerificationSystemPrompt(),
      prompt: buildVerificationUserPrompt(
        descriptionText,
        extractedSummary,
        glossarySummary,
        gapsSummary,
      ),
    });

    // Merge only genuinely new glossary gaps (dedup against existing)
    const existingGapKeys = new Set(
      finalGlossaryGaps.map((g) => normalizeGapText(g.text)),
    );
    for (const gap of sweepResult.glossaryGaps) {
      if (!existingGapKeys.has(normalizeGapText(gap.text))) {
        finalGlossaryGaps.push(gap);
        existingGapKeys.add(normalizeGapText(gap.text));
      }
    }

    // If no unmatched items, we're done
    if (sweepResult.unmatched.length === 0) {
      console.log(`[extraction] ${roundLabel}: no unmatched items, done`);
      finalUnmatched = [];
      break;
    }

    // Validate unmatched entries against the actual glossary.
    // The LLM often claims trait values exist when they don't
    // (e.g. "Broadly convex", "Swollen basal bulb").
    const { valid: validUnmatched, demoted: demotedGaps } =
      await validateUnmatchedEntries(sweepResult.unmatched);
    for (const gap of demotedGaps) {
      if (!existingGapKeys.has(normalizeGapText(gap.text))) {
        finalGlossaryGaps.push(gap);
        existingGapKeys.add(normalizeGapText(gap.text));
      }
    }

    if (validUnmatched.length === 0) {
      console.log(
        `[extraction] ${roundLabel}: all ${sweepResult.unmatched.length} unmatched entries were hallucinated, done`,
      );
      finalUnmatched = [];
      break;
    }

    // ── Fuzzy matching: resolve unmatched via suggestion service ──────
    // Before re-extracting, try to match unmatched text directly against
    // the glossary using the same trigram/fuzzy search as the editing UI.
    const { resolved: fuzzyResolved, remaining: fuzzyRemaining } =
      await fuzzyMatchUnmatched(validUnmatched, perFeatureResults);
    if (fuzzyResolved > 0) {
      console.log(
        `[extraction] ${roundLabel}: fuzzy matched ${fuzzyResolved}/${validUnmatched.length} unmatched entries`,
      );
    }

    if (fuzzyRemaining.length === 0) {
      // Prune any hallucinated values the fuzzy matching introduced
      pruneUngroundedTraitValues(perFeatureResults, descriptionText, glossary);
      console.log(
        `[extraction] ${roundLabel}: all unmatched resolved via fuzzy matching, done`,
      );
      finalUnmatched = [];
      break;
    }

    // On the last round, just report — don't repair
    if (round === MAX_REPAIR_ROUNDS) {
      console.log(
        `[extraction] ${roundLabel}: ${fuzzyRemaining.length} unmatched after max repairs`,
      );
      finalUnmatched = fuzzyRemaining;
      break;
    }

    // Group remaining unmatched items by featureId for targeted re-extraction
    const unmatchedByFeature = new Map<number, UnmatchedEntry[]>();
    for (const entry of fuzzyRemaining) {
      let list = unmatchedByFeature.get(entry.featureId);
      if (!list) {
        list = [];
        unmatchedByFeature.set(entry.featureId, list);
      }
      list.push(entry);
    }

    console.log(
      `[extraction] ${roundLabel}: ${validUnmatched.length} unmatched across ${unmatchedByFeature.size} features, attempting repair…`,
    );

    // Re-run Step 4 for each feature with unmatched items
    let repaired = 0;
    for (const [featureId, entries] of unmatchedByFeature) {
      const feature = glossary.features.find((f) => f.id === featureId);
      if (!feature) {
        // Feature not in glossary — these are misclassified, treat as gaps
        finalGlossaryGaps.push(
          ...entries.map((e) => ({ text: e.text, reason: e.reason })),
        );
        continue;
      }

      // Build observation input from the unmatched text snippets
      const repairObs = obsByFeature.get(featureId) ?? [];
      // Add unmatched text as additional observations for the LLM to process
      const unmatchedObs: {
        structure: string;
        verbatimText: string;
        observations: {
          property: string;
          value: string;
          qualifiers: string[];
        }[];
      }[] = entries.map((e) => ({
        structure: "verification repair",
        verbatimText: e.text,
        observations: [
          { property: "unmatched", value: e.text, qualifiers: [] },
        ],
      }));

      const combinedObs = [...repairObs, ...unmatchedObs];

      try {
        const { result: repairResult } = await extractForFeature(
          feature,
          glossary,
          combinedObs,
        );

        // Prune hallucinated trait values from repair results too
        pruneUngroundedTraitValues(
          [{ feature, result: repairResult }],
          descriptionText,
          glossary,
        );

        // Merge repair results: add any new characters not already extracted
        const existingResult = perFeatureResults.find(
          (r) => r.feature.id === featureId,
        );
        if (existingResult) {
          const existingCharIds = new Set(
            existingResult.result.characters.map((c) => c.characterId),
          );
          for (const newChar of repairResult.characters) {
            if (!existingCharIds.has(newChar.characterId)) {
              existingResult.result.characters.push(newChar);
              repaired++;
            } else {
              // Merge trait values for categorical characters
              const existing = existingResult.result.characters.find(
                (c) => c.characterId === newChar.characterId,
              );
              if (
                existing?.kind === "categorical" &&
                newChar.kind === "categorical" &&
                existing.traitValues &&
                newChar.traitValues
              ) {
                const existingTvIds = new Set(
                  existing.traitValues.map((tv) => tv.traitValueId),
                );
                for (const tv of newChar.traitValues) {
                  if (!existingTvIds.has(tv.traitValueId)) {
                    existing.traitValues.push(tv);
                    repaired++;
                  }
                }
              }
            }
          }
        } else {
          perFeatureResults.push({ feature, result: repairResult });
          repaired += repairResult.characters.length;
        }
      } catch (err) {
        console.error(
          `[extraction]   Repair for "${feature.label}" failed:`,
          err,
        );
        finalUnmatched.push(...entries);
      }
    }

    console.log(
      `[extraction] ${roundLabel}: repaired ${repaired} character entries`,
    );

    // Prune any hallucinated trait values introduced by fuzzy matching
    // or LLM re-extraction (e.g. "Brownish" when description never says "brownish")
    pruneUngroundedTraitValues(perFeatureResults, descriptionText, glossary);

    if (repaired === 0) {
      // Nothing was fixable — stop looping
      finalUnmatched = sweepResult.unmatched;
      break;
    }
    // Continue to next round for re-verification
  }

  // ── Final hydration ───────────────────────────────────────────────
  const { characterById, traitValueById, unitById } = buildLookups(glossary);

  const states: GroupedCharacterFormValue = [];
  for (const { feature, result } of perFeatureResults) {
    const characters = hydrateCharacters(
      result.characters,
      feature,
      characterById,
      traitValueById,
      modifierById,
      unitById,
      glossary.traitValuesByCharacter,
      glossary,
    );
    if (characters.length > 0) {
      states.push({
        featureId: feature.id,
        featureLabel: feature.label,
        notes: "",
        characters,
      });
    }
  }

  // Deduplicate glossary gaps using normalized keys
  const dedupedGaps = deduplicateGaps(finalGlossaryGaps);

  console.log(
    `[extraction] Done: ${states.length} features, ${finalUnmatched.length} unmatched, ${dedupedGaps.length} gaps`,
  );

  return {
    states,
    unmatched: finalUnmatched,
    glossaryGaps: dedupedGaps,
  };
}

// ── Gap deduplication ────────────────────────────────────────────────

/** Normalize gap text for dedup: strip "Structure: " prefix, lowercase, collapse whitespace. */
function normalizeGapText(text: string): string {
  return text
    .replace(/^[A-Za-z]+:\s*/, "") // strip structure prefix like "Gills: "
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function deduplicateGaps(gaps: GlossaryGap[]): GlossaryGap[] {
  const seen = new Set<string>();
  const result: GlossaryGap[] = [];
  for (const gap of gaps) {
    const key = normalizeGapText(gap.text);
    if (!seen.has(key)) {
      seen.add(key);
      result.push(gap);
    }
  }
  return result;
}

// ── Post-Step-4: prune hallucinated trait value selections ─────────

/**
 * Remove categorical trait values the LLM selected from the glossary
 * that aren't grounded in the original description text.
 * Each significant word (>= 4 chars) in the trait value label must
 * appear somewhere in the raw description.
 */
function pruneUngroundedTraitValues(
  perFeatureResults: { feature: FeatureDetailDTO; result: StateExtraction }[],
  descriptionText: string,
  glossary: ExtractionGlossary,
): void {
  const descLower = descriptionText.toLowerCase();
  let pruned = 0;

  for (const { feature, result } of perFeatureResults) {
    for (const charExtraction of result.characters) {
      if (charExtraction.kind !== "categorical" || !charExtraction.traitValues)
        continue;

      const charMeta = feature.characters.find(
        (c) => c.id === charExtraction.characterId,
      );
      if (!charMeta || charMeta.type !== "categorical") continue;

      const availableTvs =
        glossary.traitValuesByCharacter.get(charMeta.id) ?? [];
      const tvById = new Map(availableTvs.map((tv) => [tv.id, tv]));

      const before = charExtraction.traitValues.length;
      charExtraction.traitValues = charExtraction.traitValues.filter((tv) => {
        const tvMeta = tvById.get(tv.traitValueId);
        if (!tvMeta) return true; // keep unknown IDs — caught elsewhere

        // Every significant word in the label must appear in the description
        const words = tvMeta.label
          .toLowerCase()
          .split(/[\s,;-]+/)
          .filter((w) => w.length >= 4);
        if (words.length === 0) return true;
        return words.every((w) => descLower.includes(w));
      });

      const removed = before - charExtraction.traitValues.length;
      if (removed > 0) {
        console.log(
          `[extraction] Pruned ${removed} ungrounded trait value(s) from ${feature.label} > ${charMeta.label}`,
        );
        pruned += removed;
      }
    }
  }

  if (pruned > 0) {
    console.log(
      `[extraction] Post-Step-4 pruning: removed ${pruned} hallucinated trait value(s)`,
    );
  }
}

// ── Step 7: fuzzy trait value matching for unmatched entries ─────────

/**
 * Try to resolve unmatched entries by querying the suggestion service,
 * which uses trigram similarity and normalized matching in the DB.
 * e.g. "yellowish brown" → "Yellow-brown" via the same fuzzy matching
 * used in the character editing UI.
 *
 * Returns entries that were successfully matched (and directly assigned)
 * and entries that remain unresolved.
 */
async function fuzzyMatchUnmatched(
  entries: UnmatchedEntry[],
  perFeatureResults: { feature: FeatureDetailDTO; result: StateExtraction }[],
): Promise<{ resolved: number; remaining: UnmatchedEntry[] }> {
  const remaining: UnmatchedEntry[] = [];
  let resolved = 0;

  for (const entry of entries) {
    // Extract the value portion after "Feature: " prefix
    const colonIdx = entry.text.indexOf(":");
    const queryText =
      colonIdx >= 0 ? entry.text.slice(colonIdx + 1).trim() : entry.text;

    const suggestions = await searchCategoricalSuggestions({
      featureId: entry.featureId,
      q: queryText,
      limit: 1,
    });

    if (suggestions.length === 0) {
      remaining.push(entry);
      continue;
    }

    const best = suggestions[0]!;

    // Assign the matched trait value directly
    const existingResult = perFeatureResults.find(
      (r) => r.feature.id === entry.featureId,
    );
    if (!existingResult) {
      remaining.push(entry);
      continue;
    }

    let charEntry = existingResult.result.characters.find(
      (c) => c.characterId === best.characterId && c.kind === "categorical",
    );

    const alreadyHas = charEntry?.traitValues?.some(
      (t) => t.traitValueId === best.traitValueId,
    );
    if (alreadyHas) {
      // Already present — this unmatched claim is stale, just drop it
      resolved++;
      continue;
    }

    if (!charEntry) {
      charEntry = {
        characterId: best.characterId,
        kind: "categorical" as const,
        traitValues: [],
        displayValue: null,
        displayMin: null,
        displayMax: null,
        unitId: null,
        qualifiers: null,
      };
      existingResult.result.characters.push(charEntry);
    }

    charEntry.traitValues!.push({
      traitValueId: best.traitValueId,
      qualifiers: [],
    });
    console.log(
      `[extraction] Fuzzy matched "${entry.text}" → ${best.featureLabel} > ${best.characterLabel} > "${best.traitValueLabel}"`,
    );
    resolved++;
  }

  return { resolved, remaining };
}

// ── Post-Step-1: observation sanitization ───────────────────────────

/**
 * Validate Step 1 observation values against the raw description text.
 * For each sub-observation value, check that every significant word
 * (length >= 4) actually appears in the original description.
 * If a word is hallucinated (e.g. "grayish" when description says
 * "yellowish"), strip it from the value. If the entire value is
 * hallucinated, remove the sub-observation.
 */
function sanitizeObservationValues(
  observations: StructuredObservations,
  descriptionText: string,
): void {
  const descLower = descriptionText.toLowerCase();
  let stripped = 0;
  let removed = 0;

  for (const obs of observations.observations) {
    const sanitized: typeof obs.observations = [];

    for (const sub of obs.observations) {
      // Skip non-textual properties (numbers, dimensions)
      if (/^\d/.test(sub.value) || /[×x]\s*\d/.test(sub.value)) {
        sanitized.push(sub);
        continue;
      }

      // For compound values like "grayish brown, yellowish brown",
      // check each comma-separated segment independently
      const segments = sub.value.split(/,\s*/);
      const keptSegments: string[] = [];

      for (const segment of segments) {
        const trimmed = segment.trim();
        if (!trimmed) continue;

        // Check if the whole segment appears in the description
        if (descLower.includes(trimmed.toLowerCase())) {
          keptSegments.push(trimmed);
          continue;
        }

        // Check word-by-word: every word >= 4 chars must appear in description
        const words = trimmed.toLowerCase().split(/\s+/);
        const significantWords = words.filter((w) => w.length >= 4);

        if (significantWords.length === 0) {
          // Only short words — keep it
          keptSegments.push(trimmed);
          continue;
        }

        const allGrounded = significantWords.every((w) =>
          descLower.includes(w),
        );

        if (allGrounded) {
          keptSegments.push(trimmed);
        } else {
          const missing = significantWords.filter(
            (w) => !descLower.includes(w),
          );
          console.log(
            `[extraction] Sanitized hallucinated value "${trimmed}" (words not in description: ${missing.join(", ")})`,
          );
          stripped++;
        }
      }

      if (keptSegments.length > 0) {
        sanitized.push({
          ...sub,
          value: keptSegments.join(", "),
        });
      } else {
        console.log(
          `[extraction] Removed entirely hallucinated observation: ${sub.property}: ${sub.value}`,
        );
        removed++;
      }
    }

    obs.observations = sanitized;
  }

  if (stripped > 0 || removed > 0) {
    console.log(
      `[extraction] Post-Step-1 sanitization: stripped ${stripped} hallucinated values, removed ${removed} observations`,
    );
  }
}

// ── Step 3 repair helpers ───────────────────────────────────────────

// ── Shared text helpers ─────────────────────────────────────────────

// ── Step 7: unmatched entry validation ──────────────────────────────

/**
 * Validate Step 7 "unmatched" entries against the actual glossary
 * using the suggestion service's trigram/fuzzy matching.
 * The LLM often claims trait values exist when they don't
 * (e.g. "Broadly convex", "Swollen basal bulb"). Query the suggestion
 * service to check if a plausible match actually exists.
 */
async function validateUnmatchedEntries(
  entries: UnmatchedEntry[],
): Promise<{ valid: UnmatchedEntry[]; demoted: GlossaryGap[] }> {
  const valid: UnmatchedEntry[] = [];
  const demoted: GlossaryGap[] = [];

  for (const entry of entries) {
    // Extract the value portion after "Feature: " prefix
    const colonIdx = entry.text.indexOf(":");
    const queryText =
      colonIdx >= 0 ? entry.text.slice(colonIdx + 1).trim() : entry.text;

    // Check for numeric content — always plausible if the entry has a number
    if (/\d/.test(queryText)) {
      valid.push(entry);
      continue;
    }

    // Use the suggestion service to check if any trait value fuzzy-matches
    const suggestions = await searchCategoricalSuggestions({
      featureId: entry.featureId,
      q: queryText,
      limit: 1,
    });

    if (suggestions.length > 0) {
      valid.push(entry);
    } else {
      console.log(
        `[extraction] Demoted hallucinated unmatched: "${entry.text}" (no matching trait value in feature ${entry.featureId})`,
      );
      demoted.push({
        text: entry.text,
        reason: `${entry.reason} (claimed trait value does not exist in glossary)`,
      });
    }
  }

  if (demoted.length > 0) {
    console.log(
      `[extraction] Step 7 validation: demoted ${demoted.length}/${entries.length} hallucinated unmatched entries to glossary gaps`,
    );
  }

  return { valid, demoted };
}

// ── Post-Step-6: modifier recovery ──────────────────────────────────

/** Normalize qualifier text for matching: strip articles, lowercase, collapse whitespace. */
function normalizeModifierText(text: string): string {
  return text
    .toLowerCase()
    .replace(/\b(the|a|an)\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Programmatic safety net: try to match unmatched qualifiers to modifier
 * values by normalizing text (strip articles like "the", "a", "an").
 * Catches cases like "in the stem" → "in stem".
 */
function recoverUnmatchedModifiers(
  assignments: {
    characterIndex: number;
    traitValueIndex: number | null;
    modifierIds: number[];
    unmatchedQualifiers: string[];
  }[],
  allModifiers: ModifierEntry[],
): void {
  let recovered = 0;

  // Build a normalized lookup for all modifier values
  const modifiersByNormalized = new Map<string, ModifierEntry>();
  for (const m of allModifiers) {
    modifiersByNormalized.set(normalizeModifierText(m.value), m);
  }

  for (const assignment of assignments) {
    if (assignment.unmatchedQualifiers.length === 0) continue;

    const remaining: string[] = [];
    for (const q of assignment.unmatchedQualifiers) {
      const match = modifiersByNormalized.get(normalizeModifierText(q));
      if (match) {
        assignment.modifierIds.push(match.id);
        recovered++;
      } else {
        remaining.push(q);
      }
    }
    assignment.unmatchedQualifiers = remaining;
  }

  if (recovered > 0) {
    console.log(
      `[extraction] Modifier recovery: recovered ${recovered} missed matches`,
    );
  }
}

// ── Step 3 repair helpers (orphaned sub-observations) ───────────────

type OrphanedGroup = {
  observationIndex: number;
  subObservationIndices: number[];
};

/** Find sub-observations that weren't mapped to any feature in Step 3. */
function findOrphanedSubObservations(
  observations: StructuredObservations,
  narrowing: FeatureNarrowing,
): OrphanedGroup[] {
  const mappedSubObs = new Set<string>();
  for (const mapping of narrowing.observationToFeatures) {
    for (const subIdx of mapping.subObservationIndices) {
      mappedSubObs.add(`${mapping.observationIndex}:${subIdx}`);
    }
  }

  const orphaned: OrphanedGroup[] = [];
  for (let oi = 0; oi < observations.observations.length; oi++) {
    const obs = observations.observations[oi]!;
    const unmappedIndices = obs.observations
      .map((_, si) => si)
      .filter((si) => !mappedSubObs.has(`${oi}:${si}`));
    if (unmappedIndices.length > 0) {
      orphaned.push({
        observationIndex: oi,
        subObservationIndices: unmappedIndices,
      });
    }
  }
  return orphaned;
}

/** Build a StructuredObservations containing only orphaned sub-observations. */
function buildOrphanedObservations(
  observations: StructuredObservations,
  orphaned: OrphanedGroup[],
): StructuredObservations {
  return {
    observations: orphaned.map((group) => {
      const origObs = observations.observations[group.observationIndex]!;
      const filteredSubObs = group.subObservationIndices.map(
        (i) => origObs.observations[i]!,
      );
      return {
        structure: origObs.structure,
        verbatimText: origObs.verbatimText,
        observations: filteredSubObs,
        concepts: origObs.concepts,
      };
    }),
  };
}

// ── Glossary loading (filtered) ─────────────────────────────────────

async function loadGlossaryForFeatures(
  featureIds: number[],
): Promise<ExtractionGlossary> {
  console.log(
    `[extraction] Loading ${featureIds.length} features sequentially…`,
  );
  const features: FeatureDetailDTO[] = [];
  for (const id of featureIds) {
    const detail = await getFeature({ id });
    if (detail) features.push(detail);
  }

  const categoricalCharIds = features.flatMap((f) =>
    f.characters.filter((c) => c.type === "categorical").map((c) => c.id),
  );

  console.log(`[extraction] Loading traitValues/unitFamilies in parallel…`);
  const [traitValuesByCharacter, unitFamilies] = await Promise.all([
    listAllTraitValuesByCharacters(categoricalCharIds),
    listUnitFamilies(),
  ]);
  console.log("[extraction] Glossary loaded");

  // Modifiers are loaded later, only when needed (Steps 5–6)
  return { features, traitValuesByCharacter, modifiers: [], unitFamilies };
}

// ── Per-feature LLM call (Step 4) ───────────────────────────────────

async function extractForFeature(
  feature: FeatureDetailDTO,
  glossary: ExtractionGlossary,
  structuredObs: {
    structure: string;
    verbatimText: string;
    observations: { property: string; value: string; qualifiers: string[] }[];
  }[],
): Promise<{ feature: FeatureDetailDTO; result: StateExtraction }> {
  const perFeatureGlossary: PerFeatureGlossary = {
    feature,
    traitValuesByCharacter: glossary.traitValuesByCharacter,
    unitFamilies: glossary.unitFamilies,
  };

  const systemPrompt = buildStateExtractionSystemPrompt(perFeatureGlossary);
  console.log(
    `[extraction]   Feature "${feature.label}" (${feature.id}): ${systemPrompt.length} chars`,
  );

  const { output: result } = await generateText({
    model: extractionModel,
    temperature: 0,
    output: Output.object({ schema: stateExtractionSchema }),
    system: systemPrompt,
    prompt: buildStateExtractionUserPrompt(structuredObs),
  });

  console.log(
    `[extraction]   Feature "${feature.label}" (${feature.id}): ${result.characters.length} characters extracted, ${result.glossaryGaps.length} glossary gaps`,
  );

  return { feature, result };
}

// ── Qualifier collection ────────────────────────────────────────────

/** Collect all unique qualifier strings from Step 4 results. */
function collectQualifiers(
  results: { feature: FeatureDetailDTO; result: StateExtraction }[],
): Set<string> {
  const qualifiers = new Set<string>();
  for (const { result } of results) {
    for (const char of result.characters) {
      if (char.kind === "categorical" && char.traitValues) {
        for (const tv of char.traitValues) {
          for (const q of tv.qualifiers) qualifiers.add(q);
        }
      } else if (char.qualifiers) {
        for (const q of char.qualifiers) qualifiers.add(q);
      }
    }
  }
  return qualifiers;
}

// ── Modifier helpers ────────────────────────────────────────────────

type ModifierEntry = Awaited<ReturnType<typeof listAllModifiers>>[number];

/** Derive unique modifier groups from the flat modifier list. */
function deriveModifierGroups(
  modifiers: ModifierEntry[],
): { id: number; label: string }[] {
  const groups = new Map<number, string>();
  for (const m of modifiers) {
    if (!groups.has(m.groupId)) groups.set(m.groupId, m.groupLabel);
  }
  return [...groups.entries()].map(([id, label]) => ({ id, label }));
}

/** Build grouped modifier values for requested groups. */
function buildModifierGroupValues(
  allModifiers: ModifierEntry[],
  requestedGroupIds: Set<number>,
): { id: number; label: string; values: ModifierEntry[] }[] {
  const groups = new Map<
    number,
    { id: number; label: string; values: ModifierEntry[] }
  >();
  for (const m of allModifiers) {
    if (!requestedGroupIds.has(m.groupId)) continue;
    let group = groups.get(m.groupId);
    if (!group) {
      group = { id: m.groupId, label: m.groupLabel, values: [] };
      groups.set(m.groupId, group);
    }
    group.values.push(m);
  }
  return [...groups.values()];
}

/** Build a summary of extracted characters with their qualifiers for Step 6. */
function buildCharacterSummaryForModifiers(
  results: { feature: FeatureDetailDTO; result: StateExtraction }[],
  glossary: ExtractionGlossary,
): string {
  const lines: string[] = [];
  let globalCharIndex = 0;

  for (const { feature, result } of results) {
    lines.push(`Feature: "${feature.label}" (id: ${feature.id})`);
    for (const char of result.characters) {
      const charMeta = feature.characters.find(
        (c) => c.id === char.characterId,
      );
      const charLabel = charMeta?.label ?? `Character ${char.characterId}`;

      if (char.kind === "categorical" && char.traitValues) {
        for (let tvIdx = 0; tvIdx < char.traitValues.length; tvIdx++) {
          const tv = char.traitValues[tvIdx]!;
          if (tv.qualifiers.length > 0) {
            const tvLabel = lookupTraitValueLabel(
              char.characterId,
              tv.traitValueId,
              glossary.traitValuesByCharacter,
            );
            lines.push(
              `  [char=${globalCharIndex}, tv=${tvIdx}] ${charLabel} → ${tvLabel}: qualifiers=[${tv.qualifiers.map((q) => `"${q}"`).join(", ")}]`,
            );
          }
        }
      } else if (char.qualifiers && char.qualifiers.length > 0) {
        lines.push(
          `  [char=${globalCharIndex}, tv=null] ${charLabel}: qualifiers=[${char.qualifiers.map((q) => `"${q}"`).join(", ")}]`,
        );
      }
      globalCharIndex++;
    }
  }
  return lines.join("\n");
}

function lookupTraitValueLabel(
  characterId: number,
  traitValueId: number,
  traitValuesByCharacter: ExtractionGlossary["traitValuesByCharacter"],
): string {
  const tvs = traitValuesByCharacter.get(characterId) ?? [];
  const tv = tvs.find((t) => t.id === traitValueId);
  return tv?.label ?? `TraitValue ${traitValueId}`;
}

/** Apply modifier assignments from Step 6 back to the Step 4 character arrays. */
function applyModifierAssignments(
  results: { feature: FeatureDetailDTO; result: StateExtraction }[],
  assignments: {
    characterIndex: number;
    traitValueIndex: number | null;
    modifierIds: number[];
    unmatchedQualifiers: string[];
  }[],
): void {
  // Build a flat list of all characters across all features to index into
  const allChars: CharacterExtraction[] = [];
  for (const { result } of results) {
    allChars.push(...result.characters);
  }

  for (const assignment of assignments) {
    const char = allChars[assignment.characterIndex];
    if (!char) continue;

    // Store resolved modifier IDs directly on the character extraction
    // We'll use a temporary property that hydration can pick up
    if (
      assignment.traitValueIndex !== null &&
      char.traitValues &&
      char.traitValues[assignment.traitValueIndex]
    ) {
      // Categorical: store on the specific trait value
      const tv = char.traitValues[assignment.traitValueIndex];
      // Replace qualifiers with resolved IDs via a convention:
      // we'll store _resolvedModifierIds on the object
      (tv as Record<string, unknown>)._resolvedModifierIds =
        assignment.modifierIds;
    } else {
      // Numeric/range: store on the character itself
      (char as Record<string, unknown>)._resolvedModifierIds =
        assignment.modifierIds;
    }
  }
}

// ── Extracted summary for sweep ─────────────────────────────────────

function buildExtractedSummary(states: GroupedCharacterFormValue): string {
  const lines: string[] = [];
  for (const group of states) {
    lines.push(`Feature: "${group.featureLabel}"`);
    for (const char of group.characters) {
      switch (char.kind) {
        case "categorical": {
          const mods =
            char.modifiers.length > 0
              ? ` (${char.modifiers.map((m) => m.value).join(", ")})`
              : "";
          lines.push(`  ${char.characterLabel}: ${char.trait.label}${mods}`);
          break;
        }
        case "number": {
          const unit = char.unit?.symbol ?? "";
          const mods =
            char.modifiers.length > 0
              ? ` (${char.modifiers.map((m) => m.value).join(", ")})`
              : "";
          lines.push(
            `  ${char.characterLabel}: ${char.siBaseValue} ${unit}${mods}`,
          );
          break;
        }
        case "range": {
          const unit = char.unit?.symbol ?? "";
          const min = char.siBaseMin ?? "?";
          const max = char.siBaseMax ?? "?";
          const mods =
            char.modifiers.length > 0
              ? ` (${char.modifiers.map((m) => m.value).join(", ")})`
              : "";
          lines.push(`  ${char.characterLabel}: ${min}–${max} ${unit}${mods}`);
          break;
        }
      }
    }
  }
  return lines.join("\n");
}

/** Build lookup maps from the glossary for fast ID resolution. */
function buildLookups(glossary: ExtractionGlossary) {
  const featureById = new Map<number, FeatureDetailDTO>();
  const characterById = new Map<
    number,
    CharacterInFeatureDTO & { featureId: number }
  >();
  for (const f of glossary.features) {
    featureById.set(f.id, f);
    for (const c of f.characters) {
      characterById.set(c.id, { ...c, featureId: f.id });
    }
  }

  const traitValueById = new Map<
    number,
    ExtractionGlossary["traitValuesByCharacter"] extends Map<
      number,
      (infer V)[]
    >
      ? V
      : never
  >();
  for (const [, tvs] of glossary.traitValuesByCharacter) {
    for (const tv of tvs) {
      traitValueById.set(tv.id, tv);
    }
  }

  const unitById = new Map<number, UnitDTO & { familyLabel: string }>();
  for (const family of glossary.unitFamilies) {
    for (const u of family.units) {
      unitById.set(u.id, { ...u, familyLabel: family.label });
    }
  }

  return { featureById, characterById, traitValueById, unitById };
}

function hydrateModifiers(
  modifierIds: number[],
  modifierById: Map<number, ModifierEntry>,
): ModifierTokenFormValue[] {
  const result: ModifierTokenFormValue[] = [];
  for (const id of modifierIds) {
    const mod = modifierById.get(id);
    if (!mod) continue;
    result.push({
      id: mod.id,
      value: mod.value,
      affixType: mod.affixType,
      groupId: mod.groupId,
      groupLabel: mod.groupLabel,
    });
  }
  return result;
}

function hydrateCharacters(
  rawChars: StateExtraction["characters"],
  feature: FeatureDetailDTO,
  characterById: Map<number, CharacterInFeatureDTO & { featureId: number }>,
  traitValueById: ReturnType<typeof buildLookups>["traitValueById"],
  modifierById: Map<number, ModifierEntry>,
  unitById: Map<number, UnitDTO & { familyLabel: string }>,
  traitValuesByCharacter: ExtractionGlossary["traitValuesByCharacter"],
  glossary: ExtractionGlossary,
): CharacterStateFormValue[] {
  const characters: CharacterStateFormValue[] = [];
  const featureCharIds = new Set(feature.characters.map((c) => c.id));

  for (const rawChar of rawChars) {
    const charMeta = characterById.get(rawChar.characterId);
    if (!charMeta || !featureCharIds.has(rawChar.characterId)) continue;

    switch (rawChar.kind) {
      case "categorical": {
        const validTvIds = new Set(
          (traitValuesByCharacter.get(rawChar.characterId) ?? []).map(
            (tv) => tv.id,
          ),
        );

        const hydratedTraitValues = (rawChar.traitValues ?? [])
          .filter((tv) => validTvIds.has(tv.traitValueId))
          .map((tv) => {
            const trait = traitValueById.get(tv.traitValueId);
            if (!trait) return null;
            // Use resolved modifier IDs from Step 6, fall back to empty
            const resolvedIds =
              ((tv as Record<string, unknown>)._resolvedModifierIds as
                | number[]
                | undefined) ?? [];
            return {
              id: trait.id,
              label: trait.label,
              hexCode: trait.hexCode ?? undefined,
              modifiers: hydrateModifiers(resolvedIds, modifierById),
            };
          })
          .filter((tv) => tv !== null);

        for (const tv of hydratedTraitValues) {
          characters.push({
            kind: "categorical",
            characterId: rawChar.characterId,
            characterLabel: charMeta.label,
            trait: { id: tv.id, label: tv.label, hexCode: tv.hexCode },
            modifiers: tv.modifiers,
          });
        }
        break;
      }

      case "number": {
        const displayValue = rawChar.displayValue ?? 0;
        // Validate unitId belongs to this character's unit family
        const numCharMeta = charMeta as { unitFamilyId?: number };
        const allowedUnitFamily = numCharMeta.unitFamilyId
          ? glossary.unitFamilies.find((f) => f.id === numCharMeta.unitFamilyId)
          : null;
        const allowedUnitIds = new Set(
          allowedUnitFamily?.units.map((u) => u.id) ?? [],
        );
        const validatedNumUnitId =
          rawChar.unitId && allowedUnitIds.has(rawChar.unitId)
            ? rawChar.unitId
            : (allowedUnitFamily?.units[0]?.id ?? null);
        const unit = validatedNumUnitId
          ? unitById.get(validatedNumUnitId)
          : null;
        const siBaseValue =
          unit != null ? convertToSI(displayValue, unit.scale) : displayValue;

        const resolvedIds =
          ((rawChar as Record<string, unknown>)._resolvedModifierIds as
            | number[]
            | undefined) ?? [];

        characters.push({
          kind: "number",
          characterId: rawChar.characterId,
          characterLabel: charMeta.label,
          unit: unit
            ? { id: unit.id, symbol: unit.symbol, scale: unit.scale }
            : null,
          siBaseValue,
          modifiers: hydrateModifiers(resolvedIds, modifierById),
        });
        break;
      }

      case "range": {
        // Validate unitId belongs to this character's unit family
        const rangeCharMeta = charMeta as { unitFamilyId?: number };
        const allowedRangeFamily = rangeCharMeta.unitFamilyId
          ? glossary.unitFamilies.find(
              (f) => f.id === rangeCharMeta.unitFamilyId,
            )
          : null;
        const allowedRangeUnitIds = new Set(
          allowedRangeFamily?.units.map((u) => u.id) ?? [],
        );
        const validatedRangeUnitId =
          rawChar.unitId && allowedRangeUnitIds.has(rawChar.unitId)
            ? rawChar.unitId
            : (allowedRangeFamily?.units[0]?.id ?? null);
        const unit = validatedRangeUnitId
          ? unitById.get(validatedRangeUnitId)
          : null;
        const siBaseMin =
          rawChar.displayMin != null
            ? unit != null
              ? convertToSI(rawChar.displayMin, unit.scale)
              : rawChar.displayMin
            : null;
        const siBaseMax =
          rawChar.displayMax != null
            ? unit != null
              ? convertToSI(rawChar.displayMax, unit.scale)
              : rawChar.displayMax
            : null;

        const resolvedIds =
          ((rawChar as Record<string, unknown>)._resolvedModifierIds as
            | number[]
            | undefined) ?? [];

        characters.push({
          kind: "range",
          characterId: rawChar.characterId,
          characterLabel: charMeta.label,
          unit: unit
            ? { id: unit.id, symbol: unit.symbol, scale: unit.scale }
            : null,
          siBaseMin,
          siBaseMax,
          modifiers: hydrateModifiers(resolvedIds, modifierById),
        });
        break;
      }
    }
  }

  return characters;
}
