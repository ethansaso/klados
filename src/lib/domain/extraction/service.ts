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
import { listAllTraitValuesByCharacters } from "../traits/service";

import { convertToSI } from "../units/conversion";
import { listUnitFamilies } from "../units/service";
import type { UnitDTO } from "../units/types";
import {
  type ExtractionGlossary,
  type PerFeatureGlossary,
  buildFeatureSelectionSystemPrompt,
  buildFeatureSelectionUserPrompt,
  buildPerFeatureSystemPrompt,
  buildPerFeatureUserPrompt,
  buildSweepSystemPrompt,
  buildSweepUserPrompt,
  buildTextSegmentationSystemPrompt,
  buildTextSegmentationUserPrompt,
} from "./prompts";
import {
  type PerFeatureResult,
  type UnmatchedEntry,
  type GlossaryGap,
  featureSelectionSchema,
  perFeatureResultSchema,
  textSegmentationSchema,
  unmatchedSweepSchema,
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
  console.log("[extraction] Starting extraction…");

  // Pass 1 — Feature selection: lightweight, sends only feature labels
  console.log("[extraction] Loading feature labels…");
  const featureLabels = await listAllFeatureLabels();
  console.log(`[extraction] Loaded ${featureLabels.length} feature labels`);

  console.log("[extraction] Pass 1: calling LLM for feature selection…");
  const { output: selection } = await generateText({
    model: extractionModel,
    temperature: 0,
    output: Output.object({ schema: featureSelectionSchema }),
    system: buildFeatureSelectionSystemPrompt(featureLabels),
    prompt: buildFeatureSelectionUserPrompt(descriptionText),
  });
  console.log("[extraction] Pass 1 result:", selection);

  const selectedIds = new Set(selection.featureIds);
  if (selectedIds.size === 0) {
    console.log("[extraction] No features selected, returning empty");
    return { states: [], unmatched: [], glossaryGaps: [] };
  }

  // Load glossary for selected features
  console.log(
    `[extraction] Loading glossary for ${selectedIds.size} features…`,
  );
  const glossary = await loadGlossaryForFeatures(
    featureLabels.filter((f) => selectedIds.has(f.id)).map((f) => f.id),
  );
  console.log("[extraction] Glossary loaded");

  // Pass 2 — Text segmentation: split description into per-feature snippets
  console.log("[extraction] Pass 2: calling LLM for text segmentation…");
  const { output: segmentation } = await generateText({
    model: extractionModel,
    temperature: 0,
    output: Output.object({ schema: textSegmentationSchema }),
    system: buildTextSegmentationSystemPrompt(glossary.features),
    prompt: buildTextSegmentationUserPrompt(descriptionText),
  });
  const segmentsByFeature = new Map(
    segmentation.segments.map((s) => [s.featureId, s.text]),
  );
  console.log(
    "[extraction] Pass 2 result:",
    segmentation.segments.map((s) => ({
      featureId: s.featureId,
      textLength: s.text.length,
    })),
  );
  if (segmentation.unassignedText.length > 0) {
    console.log(
      "[extraction] Pass 2 unassigned text:",
      segmentation.unassignedText,
    );
  }

  // Build segmentation summary for the sweep (so it knows which text went where)
  const segmentationSummary = segmentation.segments
    .map((s) => {
      const feature = glossary.features.find((f) => f.id === s.featureId);
      return `"${feature?.label ?? s.featureId}": ${s.text}`;
    })
    .join("\n");

  // Pass 3 — Per-feature extraction: one focused call per feature, in parallel
  // Only call features that received segmented text
  const featuresWithText = glossary.features.filter((f) =>
    segmentsByFeature.has(f.id),
  );
  console.log(
    `[extraction] Pass 3: extracting ${featuresWithText.length} features sequentially…`,
  );
  const perFeatureResults: {
    feature: FeatureDetailDTO;
    result: PerFeatureResult;
  }[] = [];
  for (const feature of featuresWithText) {
    try {
      const res = await extractForFeature(
        feature,
        glossary,
        segmentsByFeature.get(feature.id)!,
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
    `[extraction] Pass 3: ${perFeatureResults.length}/${featuresWithText.length} features succeeded`,
  );

  // Hydrate per-feature results
  const { featureById, characterById, traitValueById, modifierById, unitById } =
    buildLookups(glossary);

  const states: GroupedCharacterFormValue = [];
  const reportedGaps: GlossaryGap[] = [];

  // Feature-level gaps from Pass 2 (text that couldn't be assigned to any feature)
  for (const gap of segmentation.unassignedText) {
    reportedGaps.push({ text: gap.text, reason: gap.reason });
  }

  for (const { feature, result } of perFeatureResults) {
    const characters = hydrateCharacters(
      result.characters,
      feature,
      characterById,
      traitValueById,
      modifierById,
      unitById,
      glossary.traitValuesByCharacter,
    );
    if (characters.length > 0) {
      states.push({
        featureId: feature.id,
        featureLabel: feature.label,
        characters,
      });
    }
    if (result.glossaryGaps.length > 0) {
      reportedGaps.push(...result.glossaryGaps);
    }
  }

  // Pass 4 — Sweep: find missed extractions + validate reported glossary gaps
  console.log("[extraction] Pass 4: running sweep…");
  const extractedSummary = buildExtractedSummary(states);
  const reportedGapsSummary =
    reportedGaps.length > 0
      ? reportedGaps.map((g) => `- "${g.text}": ${g.reason}`).join("\n")
      : "";
  const glossarySummary = glossary.features
    .map((f) => {
      const charNames = f.characters.map((c) => c.label).join(", ");
      return `- ${f.label} → ${charNames}`;
    })
    .join("\n");
  const { output: sweepResult } = await generateText({
    model: extractionModel,
    temperature: 0,
    output: Output.object({ schema: unmatchedSweepSchema }),
    system: buildSweepSystemPrompt(),
    prompt: buildSweepUserPrompt(
      descriptionText,
      extractedSummary,
      reportedGapsSummary,
      segmentationSummary,
      glossarySummary,
    ),
  });
  console.log(
    "[extraction] Pass 4 result:",
    JSON.stringify({
      unmatched: sweepResult.unmatched,
      confirmedGlossaryGaps: sweepResult.confirmedGlossaryGaps,
    }),
  );

  return {
    states,
    unmatched: sweepResult.unmatched,
    glossaryGaps: sweepResult.confirmedGlossaryGaps,
  };
}

// ── Glossary loading (filtered) ─────────────────────────────────────

async function loadGlossaryForFeatures(
  featureIds: number[],
): Promise<ExtractionGlossary> {
  // Load selected features sequentially (typically 2–5, safe for pool)
  console.log(
    `[extraction] Loading ${featureIds.length} features sequentially…`,
  );
  const features: FeatureDetailDTO[] = [];
  for (const id of featureIds) {
    console.log(`[extraction]   getFeature(${id})…`);
    const detail = await getFeature({ id });
    if (detail) features.push(detail);
    console.log(`[extraction]   getFeature(${id}) done`);
  }

  // Collect all categorical character IDs for trait value loading
  const categoricalCharIds = features.flatMap((f) =>
    f.characters.filter((c) => c.type === "categorical").map((c) => c.id),
  );

  // Load trait values, modifiers, and unit families in parallel
  console.log(
    `[extraction] Loading traitValues/modifiers/unitFamilies in parallel…`,
  );
  const [traitValuesByCharacter, modifiers, unitFamilies] = await Promise.all([
    listAllTraitValuesByCharacters(categoricalCharIds),
    listAllModifiers(),
    listUnitFamilies(),
  ]);
  console.log("[extraction] Parallel loads done");

  return { features, traitValuesByCharacter, modifiers, unitFamilies };
}

// ── Per-feature LLM call ────────────────────────────────────────────

async function extractForFeature(
  feature: FeatureDetailDTO,
  glossary: ExtractionGlossary,
  descriptionText: string,
): Promise<{ feature: FeatureDetailDTO; result: PerFeatureResult }> {
  const perFeatureGlossary: PerFeatureGlossary = {
    feature,
    traitValuesByCharacter: glossary.traitValuesByCharacter,
    modifiers: glossary.modifiers,
    unitFamilies: glossary.unitFamilies,
  };

  const systemPrompt = buildPerFeatureSystemPrompt(perFeatureGlossary);
  console.log(
    `[extraction]   Feature "${feature.label}" (${feature.id}): ${systemPrompt.length} chars`,
  );

  const { output: result } = await generateText({
    model: extractionModel,
    temperature: 0,
    output: Output.object({ schema: perFeatureResultSchema }),
    system: systemPrompt,
    prompt: buildPerFeatureUserPrompt(descriptionText),
  });

  console.log(
    `[extraction]   Feature "${feature.label}" (${feature.id}): ${result.characters.length} characters extracted, ${result.glossaryGaps?.length ?? 0} glossary gaps`,
  );

  return { feature, result };
}

// ── Extracted summary for sweep ─────────────────────────────────────

function buildExtractedSummary(states: GroupedCharacterFormValue): string {
  const lines: string[] = [];
  for (const group of states) {
    lines.push(`Feature: "${group.featureLabel}"`);
    for (const char of group.characters) {
      switch (char.kind) {
        case "categorical": {
          const vals = char.traitValues
            .map((tv) => {
              const mods =
                tv.modifiers.length > 0
                  ? ` (${tv.modifiers.map((m) => m.value).join(", ")})`
                  : "";
              return `${tv.label}${mods}`;
            })
            .join(", ");
          lines.push(`  ${char.characterLabel}: ${vals}`);
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

  const modifierById = new Map(glossary.modifiers.map((m) => [m.id, m]));

  const unitById = new Map<number, UnitDTO & { familyLabel: string }>();
  for (const family of glossary.unitFamilies) {
    for (const u of family.units) {
      unitById.set(u.id, { ...u, familyLabel: family.label });
    }
  }

  return { featureById, characterById, traitValueById, modifierById, unitById };
}

function hydrateModifiers(
  modifierIds: number[],
  modifierById: Map<number, ExtractionGlossary["modifiers"][number]>,
): ModifierTokenFormValue[] {
  const result: ModifierTokenFormValue[] = [];
  for (const id of modifierIds) {
    const mod = modifierById.get(id);
    if (!mod) continue; // skip invalid — could also push to unmatched
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
  rawChars: PerFeatureResult["characters"],
  feature: FeatureDetailDTO,
  characterById: Map<number, CharacterInFeatureDTO & { featureId: number }>,
  traitValueById: ReturnType<typeof buildLookups>["traitValueById"],
  modifierById: Map<number, ExtractionGlossary["modifiers"][number]>,
  unitById: Map<number, UnitDTO & { familyLabel: string }>,
  traitValuesByCharacter: ExtractionGlossary["traitValuesByCharacter"],
): CharacterStateFormValue[] {
  const characters: CharacterStateFormValue[] = [];

  // Build set of character IDs that actually belong to this feature
  const featureCharIds = new Set(feature.characters.map((c) => c.id));

  for (const rawChar of rawChars) {
    const charMeta = characterById.get(rawChar.characterId);
    // Skip characters not in glossary or not belonging to this feature
    if (!charMeta || !featureCharIds.has(rawChar.characterId)) continue;

    switch (rawChar.kind) {
      case "categorical": {
        // Valid trait value IDs for this specific character
        const validTvIds = new Set(
          (traitValuesByCharacter.get(rawChar.characterId) ?? []).map(
            (tv) => tv.id,
          ),
        );

        // Deduplicate: when the model returns the same trait value twice
        // (e.g. bare "flat" + "Becoming flat"), keep the one with modifiers.
        const tvMap = new Map<number, (typeof hydratedTraitValues)[number]>();
        const hydratedTraitValues = (rawChar.traitValues ?? [])
          .filter((tv) => validTvIds.has(tv.traitValueId))
          .map((tv) => {
            const trait = traitValueById.get(tv.traitValueId);
            if (!trait) return null;
            return {
              id: trait.id,
              label: trait.label,
              hexCode: trait.hexCode ?? undefined,
              modifiers: hydrateModifiers(tv.modifierIds, modifierById),
            };
          })
          .filter((tv) => tv !== null);

        for (const tv of hydratedTraitValues) {
          const existing = tvMap.get(tv.id);
          // Prefer the entry with more modifiers
          if (!existing || tv.modifiers.length > existing.modifiers.length) {
            tvMap.set(tv.id, tv);
          }
        }
        const traitValues = [...tvMap.values()];

        if (traitValues.length > 0) {
          characters.push({
            kind: "categorical",
            characterId: rawChar.characterId,
            characterLabel: charMeta.label,
            traitValues,
          });
        }
        break;
      }

      case "number": {
        const displayValue = rawChar.displayValue ?? 0;
        const unit = rawChar.unitId ? unitById.get(rawChar.unitId) : null;
        const siBaseValue =
          unit != null ? convertToSI(displayValue, unit.scale) : displayValue;

        characters.push({
          kind: "number",
          characterId: rawChar.characterId,
          characterLabel: charMeta.label,
          unit: unit
            ? { id: unit.id, symbol: unit.symbol, scale: unit.scale }
            : null,
          siBaseValue,
          modifiers: hydrateModifiers(rawChar.modifierIds ?? [], modifierById),
        });
        break;
      }

      case "range": {
        const unit = rawChar.unitId ? unitById.get(rawChar.unitId) : null;
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

        characters.push({
          kind: "range",
          characterId: rawChar.characterId,
          characterLabel: charMeta.label,
          unit: unit
            ? { id: unit.id, symbol: unit.symbol, scale: unit.scale }
            : null,
          siBaseMin,
          siBaseMax,
          modifiers: hydrateModifiers(rawChar.modifierIds ?? [], modifierById),
        });
        break;
      }
    }
  }

  return characters;
}
