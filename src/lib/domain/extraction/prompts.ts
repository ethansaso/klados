import type { FeatureDetailDTO, FeatureDTO } from "../features/types";
import type { ModifierDTO } from "../modifiers/types";
import type { ExtractionTraitValue } from "../traits/repo";
import type { UnitFamilyDTO } from "../units/types";
import type { StructuredObservations } from "./schemas";

type ModifierGlossaryEntry = Pick<
  ModifierDTO,
  "id" | "value" | "affixType" | "groupId"
> & { groupLabel: string };

export type ExtractionGlossary = {
  features: FeatureDetailDTO[];
  traitValuesByCharacter: Map<number, ExtractionTraitValue[]>;
  modifiers: ModifierGlossaryEntry[];
  unitFamilies: UnitFamilyDTO[];
};

// ── Step 1: Structured observations (glossary-free) ─────────────────

const OBSERVATION_PREAMBLE = `You are a morphological description parser for biological taxonomy.

Your task: Parse a free-text morphological description into structured observations. You have NO glossary — just read the text and extract what you find.

For each anatomical structure mentioned (cap, stem, gills, spores, etc.), produce:
1. The verbatim text describing it.
2. Structured sub-observations: each property (color, shape, texture, size, etc.) with its value and any qualifiers.
3. Concept keywords — synonyms, related terms, and hypernyms that could help match this to a feature database. Think broadly: "warts" could relate to "surface ornament", "veil remnants", "cap decorations". "Cottony" could relate to "texture", "surface covering".

Rules:
- Parse ALL morphological information. Do not skip anything structural.
- Ignore non-morphological text (habitat, distribution, ecology, geographic range).
- Preserve qualifiers exactly as written: "somewhat", "slightly", "usually", "at maturity", "when fresh", "on exposure", etc. These go in the qualifiers array.
- QUALIFIER ATTACHMENT: Qualifiers modify the value they are syntactically adjacent to. In "sticky when fresh", "when fresh" qualifies "sticky". In "bald, cottony, sticky when fresh", only "sticky" gets the qualifier — "bald" and "cottony" have no qualifiers. Do NOT redistribute qualifiers to nearby values. Each value-qualifier group becomes its OWN observation entry.
- SUB-STRUCTURE PROPERTIES: When adjectives describe a sub-structure ("cottony, whitish warts"), each adjective is a SEPARATE property observation of that sub-structure. "cottony" → ornament texture, "whitish" → ornament color, "warts" → ornament type. Likewise "skirtlike, whitish ring" → ring type + ring color.
- NEGATION: Negative statements are meaningful observations. "not discoloring on exposure" → property: "color change", value: "not discoloring", qualifiers: ["on exposure"]. "lacking an annulus" → property: "annulus", value: "absent". Do not skip negations.
- STRUCTURAL DESCRIPTIONS: Shape terms like "tapering to apex", "swollen basal bulb", "expanding downward" describe the shape or form of a structure. Extract them as shape/form observations.
- For compound sentences with alternatives ("not X, or Y"), parse each alternative as a separate observation with its own qualifiers.
- For dimensional notation ("AxB µm"), extract both dimensions as separate property observations (e.g. length and width/diameter).
- Generate concept keywords generously — include the literal term, morphological root forms, synonyms, hypernyms, and related anatomical concepts. This is used for feature matching, so broader is better.

--- EXAMPLE ---

Input: "Cap: 3–5 cm, convex, bald, sticky when fresh, adorned with cottony, whitish warts; the margin somewhat lined at maturity. Stem: tapering to apex and ending in a swollen basal bulb; with a skirtlike, whitish ring above. Flesh white, not discoloring on exposure."

Output:
{
  "observations": [
    {
      "structure": "cap",
      "verbatimText": "3–5 cm, convex, bald, sticky when fresh, adorned with cottony, whitish warts; the margin somewhat lined at maturity",
      "observations": [
        { "property": "diameter", "value": "3–5 cm", "qualifiers": [] },
        { "property": "shape", "value": "convex", "qualifiers": [] },
        { "property": "texture", "value": "bald", "qualifiers": [] },
        { "property": "texture", "value": "sticky", "qualifiers": ["when fresh"] },
        { "property": "surface ornament", "value": "warts", "qualifiers": [] },
        { "property": "ornament texture", "value": "cottony", "qualifiers": [] },
        { "property": "ornament color", "value": "whitish", "qualifiers": [] },
        { "property": "margin texture", "value": "lined", "qualifiers": ["somewhat", "at maturity"] }
      ],
      "concepts": ["cap", "pileus", "diameter", "size", "shape", "convex", "bald", "sticky", "texture", "warts", "warty", "surface ornament", "veil remnants", "cap decorations", "cottony", "whitish", "color", "margin", "lined", "striate"]
    },
    {
      "structure": "stem",
      "verbatimText": "tapering to apex and ending in a swollen basal bulb; with a skirtlike, whitish ring above",
      "observations": [
        { "property": "shape", "value": "tapering to apex", "qualifiers": [] },
        { "property": "base shape", "value": "swollen basal bulb", "qualifiers": [] },
        { "property": "ring type", "value": "skirtlike", "qualifiers": [] },
        { "property": "ring color", "value": "whitish", "qualifiers": [] }
      ],
      "concepts": ["stem", "stipe", "tapering", "shape", "basal bulb", "swollen", "bulbous", "ring", "annulus", "skirtlike", "whitish", "color"]
    },
    {
      "structure": "flesh",
      "verbatimText": "white, not discoloring on exposure",
      "observations": [
        { "property": "color", "value": "white", "qualifiers": [] },
        { "property": "color change", "value": "not discoloring", "qualifiers": ["on exposure"] }
      ],
      "concepts": ["flesh", "context", "trama", "white", "color", "color change", "discoloring", "staining", "reaction"]
    }
  ]
}

Key points:
- "bald, sticky when fresh" → "bald" has NO qualifiers, "sticky" gets ["when fresh"]. The qualifier attaches to its adjacent value.
- "cottony, whitish warts" → THREE separate observations: ornament type (warts), ornament texture (cottony), ornament color (whitish).
- "skirtlike, whitish ring" → ring type (skirtlike) + ring color (whitish) as separate properties.
- "not discoloring on exposure" → captured as a negation observation, not skipped.
- "tapering to apex" and "swollen basal bulb" → captured as shape observations.
`;

export function buildObservationSystemPrompt(): string {
  return OBSERVATION_PREAMBLE;
}

export function buildObservationUserPrompt(descriptionText: string): string {
  return `Parse the following morphological description into structured observations:\n\n${descriptionText}`;
}

// ── Step 2: Feature request (names only) ────────────────────────────

const FEATURE_REQUEST_PREAMBLE = `You are a feature-matching assistant for a biological taxonomy platform.

You are given structured observations from a morphological description, plus a list of available feature names (with IDs). Your job is to REQUEST features that might be relevant — you will get their full descriptions in the next step to make a final decision.

Rules:
- Be INCLUSIVE. Request any feature whose name could plausibly relate to the observations. You will narrow down later.
- Match on concept keywords, not just literal structure names. "Warts" could be "Veil Remnants". "Cottony" could be "Cap" or "Veil Remnants".
- Request parent AND child features when both could apply.
- When in doubt, request it — it's better to request too many than to miss one.
`;

export function buildFeatureRequestSystemPrompt(
  featureLabels: Pick<FeatureDTO, "id" | "label">[],
): string {
  const list = featureLabels
    .map((f) => `- "${f.label}" (id: ${f.id})`)
    .join("\n");
  return FEATURE_REQUEST_PREAMBLE + "\n--- AVAILABLE FEATURES ---\n\n" + list;
}

export function buildFeatureRequestUserPrompt(
  observations: StructuredObservations,
): string {
  const summary = observations.observations
    .map((o) => {
      const concepts = o.concepts.join(", ");
      return `Structure: "${o.structure}" — concepts: ${concepts}`;
    })
    .join("\n");
  return `Which features should I load details for, given these observations?\n\n${summary}`;
}

// ── Step 3: Feature narrowing (with descriptions) ───────────────────

const FEATURE_NARROWING_PREAMBLE = `You are a feature-matching assistant for a biological taxonomy platform.

You previously requested feature details. Now you see the full descriptions. Your job is to:
1. Narrow to ONLY the features that genuinely match the observations.
2. Map each SUB-OBSERVATION to the feature(s) it belongs to.

CRITICAL: Map at the SUB-OBSERVATION level, not the structure level. A single structure like "cap" may contain sub-observations for MULTIPLE features. For example:
- Cap diameter, shape, texture, color → "Cap" feature
- Ornament type (warts), ornament texture (cottony), ornament color (whitish) → "Veil Remnants" feature
- Margin texture (lined) → "Cap" feature

CROSS-STRUCTURAL MAPPING: Sub-observations often describe structures that belong to a DIFFERENT feature than the parent structure they were parsed from. Common patterns in mycology:
- "ring" or "annulus" observations found within "stem" → "Annulus" feature
- "volva" or "basal bulb" observations within "stem" → "Volva" feature  
- "warts", "patches", "ornament" observations on "cap" → "Veil Remnants" feature
- "margin" observations on "cap" → may go to "Cap" or a dedicated margin feature
Always check whether a sub-observation's property name suggests a different feature than the parent structure.

IMPORTANT: Cross-structural mapping applies to NAMED SUB-STRUCTURES (ring, volva, ornament, etc.) — NOT to the structure's own core properties. A structure's core measurements (length, diameter, width), color, texture, and shape almost always belong to the PARENT structure's feature. For example:
- Stem length, diameter, color, texture → "Stipe" feature (NOT Annulus or Volva)
- Stem ring type, ring color → "Annulus" feature (NOT Stipe)
- Cap diameter, shape, color, texture → "Cap" feature (NOT Veil Remnants)
- Cap ornament type, ornament texture, ornament color → "Veil Remnants" feature (NOT Cap)
Every structure with core properties should have those properties mapped to its own feature.

Do NOT send all sub-observations of a structure to every matching feature. Only send the specific sub-observations that belong to that feature.

Rules:
- Read feature descriptions carefully. A feature may cover concepts you wouldn't guess from the name alone.
- Different sub-observations from the same structure can (and often should) map to DIFFERENT features.
- A sub-observation can map to multiple features when genuinely relevant to both.
- Drop features that turned out to be irrelevant after reading the description.
- Every sub-observation should map to at least one feature if possible. If it cannot map to any, omit it — it will be caught as a gap later.
- Group sub-observations that map to the same feature(s) into a single entry for compactness.
`;

export function buildFeatureNarrowingSystemPrompt(
  features: Pick<FeatureDTO, "id" | "label" | "description">[],
): string {
  const list = features
    .map((f) => {
      const desc = f.description ? ` — ${f.description}` : "";
      return `- "${f.label}" (id: ${f.id})${desc}`;
    })
    .join("\n");
  return FEATURE_NARROWING_PREAMBLE + "\n--- REQUESTED FEATURES ---\n\n" + list;
}

export function buildFeatureNarrowingUserPrompt(
  observations: StructuredObservations,
): string {
  const summary = observations.observations
    .map((o, i) => {
      const props = o.observations
        .map((p, j) => {
          const quals = p.qualifiers.length
            ? ` [${p.qualifiers.join(", ")}]`
            : "";
          return `  [${j}] ${p.property}: ${p.value}${quals}`;
        })
        .join("\n");
      return `Structure [${i}]: "${o.structure}"\n  Text: "${o.verbatimText}"\n  Sub-observations:\n${props}`;
    })
    .join("\n\n");
  return `Which features match these observations? Map each sub-observation (by index) to its feature(s).\n\n${summary}`;
}

// ── Step 4: State extraction (per-feature, with characters + traits) ─

export type PerFeatureGlossary = {
  feature: FeatureDetailDTO;
  traitValuesByCharacter: ExtractionGlossary["traitValuesByCharacter"];
  unitFamilies: ExtractionGlossary["unitFamilies"];
};

function buildPerFeatureGlossaryBlock(glossary: PerFeatureGlossary): string {
  const lines: string[] = [
    `Feature: "${glossary.feature.label}" (id: ${glossary.feature.id})`,
  ];

  for (const char of glossary.feature.characters) {
    const charDesc = char.description ? ` — ${char.description}` : "";
    lines.push(
      `  Character: "${char.label}" (id: ${char.id}, type: ${char.type})${charDesc}`,
    );

    if (char.type === "categorical") {
      const tvs = glossary.traitValuesByCharacter.get(char.id) ?? [];
      for (const tv of tvs) {
        lines.push(`    Value: "${tv.label}" (id: ${tv.id})`);
      }
    } else {
      const familyId = char.unitFamilyId;
      const family = glossary.unitFamilies.find((f) => f.id === familyId);
      if (family) {
        const unitList = family.units
          .map((u) => `"${u.symbol}" (id: ${u.id})`)
          .join(", ");
        lines.push(`    Unit family: "${family.label}" — ${unitList}`);
      }
    }
  }

  return lines.join("\n");
}

const STATE_EXTRACTION_PREAMBLE = `You are a structured data extraction assistant for a biological taxonomy platform.

Your task: Given PRE-PARSED observations that have been mapped to a SINGLE feature, match them to the feature's characters and trait values. Do NOT handle modifiers — just preserve qualifier text for a later step.

IMPORTANT: The observations have ALREADY been parsed into structured property/value/qualifier tuples. USE THESE DIRECTLY — do NOT re-interpret the verbatim text. The verbatim text is provided only for context. The structured observations are the authoritative source for:
- Which values to extract
- Which qualifiers attach to which values
- Which properties belong to sub-structures vs. the main structure

Extract EVERY character that has matching data. Go through each character in the glossary and check whether ANY of the pre-parsed observations match it.

Matching rules:
- ONLY use IDs from the glossary. Never invent IDs.
- Match observation VALUES to trait value LABELS flexibly. Use morphological roots ("warts" → "Warty", "scales" → "Scaly"), synonyms, and contextual meaning.
- Each trait value belongs to EXACTLY ONE character. Match values only to the character they are listed under.
- For categorical characters: match observation values to trait value labels. Group ALL trait values for the same characterId into one entry. When observations list multiple values for the same property, select all matching trait values.
- For numeric characters: output values in the DISPLAY UNIT with the corresponding unit ID. Do NOT convert units. Open-ended ranges: "up to X" → min=null, max=X. Dimensional notation: "AxB µm" means FIRST=Length, SECOND=Width/Diameter — extract BOTH.
- QUALIFIER ATTACHMENT IS ALREADY RESOLVED: Each observation tuple has its qualifiers correctly attached. Copy qualifiers from the pre-parsed observation directly to the corresponding trait value or character. Do NOT move qualifiers between values.
- Put qualifiers in the "qualifiers" array on each trait value (for categorical) or on the character itself (for numeric/range). These will be matched to modifiers in a later step.
- If a pre-parsed observation describes something for this feature but no character or trait value in the glossary can represent it, add it to glossaryGaps.
`;

export function buildStateExtractionSystemPrompt(
  glossary: PerFeatureGlossary,
): string {
  return (
    STATE_EXTRACTION_PREAMBLE +
    "\n--- GLOSSARY ---\n\n" +
    buildPerFeatureGlossaryBlock(glossary)
  );
}

export type StructuredObservationInput = {
  structure: string;
  verbatimText: string;
  observations: { property: string; value: string; qualifiers: string[] }[];
};

export function buildStateExtractionUserPrompt(
  structuredObs: StructuredObservationInput[],
): string {
  const blocks = structuredObs.map((obs) => {
    const parsedLines = obs.observations
      .map((o) => {
        const quals =
          o.qualifiers.length > 0
            ? ` [qualifiers: ${o.qualifiers.join(", ")}]`
            : "";
        return `  - ${o.property}: ${o.value}${quals}`;
      })
      .join("\n");
    return `Structure: "${obs.structure}"\nVerbatim: "${obs.verbatimText}"\nPre-parsed observations:\n${parsedLines}`;
  });
  return `Extract character states for this feature from these pre-parsed observations. Use the structured data below — do NOT re-parse the verbatim text.\n\n${blocks.join("\n\n")}`;
}

// ── Step 5: Modifier request (group names only) ─────────────────────

const MODIFIER_REQUEST_PREAMBLE = `You are a modifier-matching assistant for a biological taxonomy platform.

The previous step extracted character states and preserved qualifier text (e.g. "somewhat", "at maturity", "when fresh", "usually"). Your job is to look at all the qualifiers and REQUEST modifier groups that might contain matching values.

Rules:
- Be INCLUSIVE. Request any group whose name suggests it could contain the qualifier.
- Think about what KIND of qualifier each is: frequency ("usually", "rarely"), degree ("somewhat", "slightly"), timing ("at maturity", "when fresh"), condition ("on exposure"), etc.
- Request the group even if you're not sure — you'll see the values next.
`;

export function buildModifierRequestSystemPrompt(
  modifierGroups: { id: number; label: string }[],
): string {
  const list = modifierGroups
    .map((g) => `- "${g.label}" (id: ${g.id})`)
    .join("\n");
  return (
    MODIFIER_REQUEST_PREAMBLE + "\n--- AVAILABLE MODIFIER GROUPS ---\n\n" + list
  );
}

export function buildModifierRequestUserPrompt(
  qualifierSummary: string,
): string {
  return `Which modifier groups should I load, given these qualifiers from the extraction?\n\n${qualifierSummary}`;
}

// ── Step 6: Modifier assignment ─────────────────────────────────────

const MODIFIER_ASSIGNMENT_PREAMBLE = `You are a modifier-matching assistant for a biological taxonomy platform.

You are given extracted character states with qualifier text, and the full modifier values for the groups you requested. Your job is to match each qualifier to the correct modifier ID — or report it as unmatched if no modifier fits.

Rules:
- Match by MEANING, not literal text. "At maturity" could match "Mature" or "At maturity". "Somewhat" matches a degree modifier, NOT a frequency modifier.
- Do NOT substitute a wrong-category modifier. If the qualifier is about degree ("somewhat", "fairly") and only frequency modifiers are available ("Sometimes", "Rarely"), report it as unmatched.
- Each assignment targets a specific character (by index) and optionally a specific trait value within it (by index). For numeric/range characters, traitValueIndex is null.
- If a qualifier has no matching modifier at all, put it in unmatchedQualifiers.
`;

export function buildModifierAssignmentSystemPrompt(
  modifierGroups: {
    id: number;
    label: string;
    values: ModifierGlossaryEntry[];
  }[],
): string {
  const lines: string[] = [];
  for (const group of modifierGroups) {
    const vals = group.values
      .map((v) => `"${v.value}" (id: ${v.id}, ${v.affixType})`)
      .join(", ");
    lines.push(`Group "${group.label}" (id: ${group.id}): ${vals}`);
  }
  return (
    MODIFIER_ASSIGNMENT_PREAMBLE +
    "\n--- MODIFIER VALUES ---\n\n" +
    lines.join("\n")
  );
}

export function buildModifierAssignmentUserPrompt(
  characterSummary: string,
): string {
  return `Match qualifiers to modifiers for these extracted characters:\n\n${characterSummary}`;
}

// ── Step 7: Verification sweep ──────────────────────────────────────

const VERIFICATION_PREAMBLE = `You are a quality-assurance assistant for a biological taxonomy data extraction pipeline.

Compare the original description against the final extraction results. Report:
1. "unmatched" — morphological traits the extraction missed but COULD have captured (a SPECIFIC character with matching trait values exists in the glossary).
2. "glossaryGaps" — morphological traits with no matching character in the glossary at all.

CLASSIFICATION DECISION TREE — apply this for EVERY trait before assigning it:
0. Is this trait ALREADY CAPTURED in the extracted results under ANY feature? Search ALL features in the results, not just the feature matching the source structure. If YES → correctly extracted. Skip it entirely.
1. Is there a FEATURE that covers this concept? If NO → glossaryGap. Stop.
2. Is there a specific CHARACTER under that feature for this trait? If NO → glossaryGap. Stop.
3. Does that character have a TRAIT VALUE that matches (for categorical) or correct units (for numeric)? If NO → glossaryGap. Stop.
4. ONLY if all four checks pass → unmatched (extraction missed something it could have captured).

Examples:
- "cap: adorned with cottony, whitish warts" — check extracted results → Veil Remnants has Warty + Cottony + Whitish → ALREADY CAPTURED. Skip (stopped at step 0).
- "short-gills" — not in extracted results → Gills feature exists, but no character for "short-gills" → glossaryGap (stopped at step 2).
- "Spore print: white" — not in extracted results → no "Spore Print" feature → glossaryGap (stopped at step 1).
- "not discoloring" — not in extracted results → Flesh feature exists, Color character exists, but no "Not discoloring" trait value → glossaryGap (stopped at step 3).
- "Cap: convex" — not in extracted results → Cap feature exists (id: 5), Shape character exists, "Convex" trait value exists, but extraction missed it → unmatched with featureId: 5 (passed all 4 checks).

For each "unmatched" entry, include the featureId of the feature that SHOULD have captured it. This is used for automated repair.

Rules:
- Do NOT re-list items that already appear in REPORTED GAPS. Those are already accounted for — adding them again is redundant.
- Match FLEXIBLY on word form: "warts" → "Warty", "smooth" → "Smooth", etc.
- CROSS-FEATURE CAPTURE IS VALID: A trait described under one structure but captured under a different feature is CORRECTLY EXTRACTED. For example, "cap: adorned with warts" captured under "Veil Remnants" (not "Cap") is correct. "stem: with a ring" captured under "Annulus" (not "Stipe") is correct. Do NOT flag these as unmatched.
- Do NOT treat a trait as covered just because a different feature extracted the same value — "Cap: white" and "Stem: white" are independent observations.
- Pay attention to qualifiers. If "at maturity" was in the text but missing from the extraction, report it.
- Ignore non-morphological text (habitat, distribution, ecology).
- The two arrays are MUTUALLY EXCLUSIVE. Never put the same item in both.
`;

export function buildVerificationSystemPrompt(): string {
  return VERIFICATION_PREAMBLE;
}

export function buildVerificationUserPrompt(
  descriptionText: string,
  extractedSummary: string,
  glossarySummary: string,
  gapsSummary: string,
): string {
  let prompt = `Original description:\n\n${descriptionText}\n\n--- GLOSSARY STRUCTURE ---\n\n${glossarySummary}\n\n--- EXTRACTED RESULTS ---\n\n${extractedSummary}`;
  if (gapsSummary) {
    prompt += `\n\n--- REPORTED GAPS (from extraction — may include false positives) ---\n\n${gapsSummary}`;
  }
  prompt += `\n\nWhat morphological information from the original description is missing?`;
  return prompt;
}
