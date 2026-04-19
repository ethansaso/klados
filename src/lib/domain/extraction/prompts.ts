import type { FeatureDetailDTO, FeatureDTO } from "../features/types";
import type { ModifierDTO } from "../modifiers/types";
import type { ExtractionTraitValue } from "../traits/repo";
import type { UnitFamilyDTO } from "../units/types";

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

// ── Pass 1: Feature selection ───────────────────────────────────────

const FEATURE_SELECTION_PREAMBLE = `You are a feature-selection assistant for a biological taxonomy platform.

Given a free-text morphological description, identify which features from the list below are discussed in the text. Return ONLY the IDs of relevant features.

Rules:
- Only select features that the description actually mentions or implies.
- Do not select features that are unrelated to the text.
- When in doubt, include the feature rather than omitting it. If text could plausibly belong to more than one feature, select both. Parent and child features are distinct — selecting a parent does NOT imply its children and vice versa.
- The sections in the input text (e.g. "Cap:", "Stem:") do NOT necessarily map one-to-one to the features below. A single text section may mention traits belonging to multiple features, and a single feature may be described across several text sections. Read the feature descriptions carefully and match based on meaning, not on section headings.
`;

export function buildFeatureSelectionSystemPrompt(
  features: Pick<FeatureDTO, "id" | "label" | "description">[],
): string {
  const featureList = features
    .map((f) => {
      const desc = f.description ? ` — ${f.description}` : "";
      return `- "${f.label}" (id: ${f.id})${desc}`;
    })
    .join("\n");
  return FEATURE_SELECTION_PREAMBLE + "\n--- FEATURES ---\n\n" + featureList;
}

export function buildFeatureSelectionUserPrompt(
  descriptionText: string,
): string {
  return `Which features are discussed in the following description?\n\n${descriptionText}`;
}

// ── Pass 2: Text segmentation ───────────────────────────────────────

const TEXT_SEGMENTATION_PREAMBLE = `You are a text segmentation assistant for a biological taxonomy platform.

Your task: Given a morphological description and a list of selected features, split the description into per-feature text segments. Each segment contains the verbatim text from the description that is relevant to that feature.

Rules:
- Copy text VERBATIM — do not paraphrase, summarize, or reword.
- A clause may be assigned to MORE THAN ONE feature when it genuinely describes both. For example, "adorned with cottony, whitish warts" under "Cap:" describes both the Cap surface and Universal Veil Remnants (warts ARE veil remnants). Duplicate the clause into both features.
- Section headings in the text (e.g. "Cap:", "Stem:") are hints but NOT definitive. A single section can contain information about multiple features. Read each clause independently and assign by meaning.
- Concatenate all relevant clauses for a feature into a single text string, separated by "; ".
- Omit features that have no matching text — do not include them in the output.
- Ignore non-morphological text (habitat, distribution, ecology, geographic range).
- If a morphological clause cannot be assigned to ANY of the listed features, add it to the unassignedText array with the verbatim snippet and a reason (e.g. "no matching feature for lamellar trama"). This helps identify gaps in the feature list. Do NOT silently drop morphological information.
`;

export function buildTextSegmentationSystemPrompt(
  features: Pick<FeatureDetailDTO, "id" | "label" | "description">[],
): string {
  const featureList = features
    .map((f) => {
      const desc = f.description ? ` — ${f.description}` : "";
      return `- "${f.label}" (id: ${f.id})${desc}`;
    })
    .join("\n");
  return TEXT_SEGMENTATION_PREAMBLE + "\n--- FEATURES ---\n\n" + featureList;
}

export function buildTextSegmentationUserPrompt(
  descriptionText: string,
): string {
  return `Segment the following morphological description by feature:\n\n${descriptionText}`;
}

// ── Pass 3: Per-feature extraction ──────────────────────────────────

export type PerFeatureGlossary = {
  feature: FeatureDetailDTO;
  traitValuesByCharacter: ExtractionGlossary["traitValuesByCharacter"];
  modifiers: ExtractionGlossary["modifiers"];
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

  const sections: string[] = [lines.join("\n")];

  // Modifiers
  const byGroup = new Map<
    number,
    { label: string; values: ModifierGlossaryEntry[] }
  >();
  for (const mod of glossary.modifiers) {
    let group = byGroup.get(mod.groupId);
    if (!group) {
      group = { label: mod.groupLabel, values: [] };
      byGroup.set(mod.groupId, group);
    }
    group.values.push(mod);
  }

  if (byGroup.size > 0) {
    const modLines: string[] = ["Modifiers:"];
    for (const [, group] of byGroup) {
      const vals = group.values
        .map((v) => `"${v.value}" (id: ${v.id}, ${v.affixType})`)
        .join(", ");
      modLines.push(`  Group "${group.label}": ${vals}`);
    }
    sections.push(modLines.join("\n"));
  }

  return sections.join("\n\n");
}

const PER_FEATURE_PREAMBLE = `You are a structured data extraction assistant for a biological taxonomy platform.

Your task: Given pre-segmented text that has already been identified as relevant to a SINGLE feature, extract ALL the character states from it.

IMPORTANT: Extract EVERY character that has matching data in the text. A feature typically has multiple characters (Color, Shape, Texture, Size, etc.). Go through each character in the glossary and check whether the text contains information for it. Do not stop after finding the first match.

The text you receive has been pre-filtered to contain ONLY information relevant to this feature. Trust it — extract everything you can match.

Matching rules:
- ONLY use IDs from the glossary. Never invent IDs.
- Match flexibly, not literally. Use morphological roots ("warts" → "Warty", "scales" → "Scaly"), synonyms, and contextual meaning. When a term doesn't literally appear in the glossary, consider what character it describes (e.g. "discoloration" → Color; "bruising blue" → Color with modifier).
- Each trait value belongs to EXACTLY ONE character. Match values only to the character they are listed under in the glossary. Do not assign a trait value to a different character.
- For categorical characters: match text to trait value labels. Group ALL trait values for the same characterId into one entry. When text lists gradients or alternatives ("brown to tan"), select all matching values.
- For numeric characters: output values in the DISPLAY UNIT with the corresponding unit ID. Do NOT convert units. Open-ended ranges: "up to X" → min=null, max=X. Dimensional notation: "AxB µm" or "A x B µm" means the FIRST number is Length and the SECOND is Width or Diameter — extract BOTH as separate characters.
- Attach modifier IDs for qualifying language ("usually", "rarely", "slightly", "when fresh", "at maturity"). If the text uses a qualifier but NO modifier in the glossary matches it, do NOT substitute a different modifier — instead report it as a glossary gap (e.g. "somewhat — no matching modifier for degree/intensity").
- If nothing in the text matches this feature, return an empty characters array.
- If the text describes a morphological trait for this feature but no character, trait value, or modifier in the glossary can represent it, add it to the glossaryGaps array with the verbatim snippet and a reason (e.g. "no matching trait value", "no character for this concept", "no matching modifier"). This helps us identify gaps in our glossary rather than silently dropping information or substituting the wrong value.

--- EXAMPLE ---

Glossary:
Feature: "Pileus" (id: 900)
  Character: "Color" (id: 800, type: categorical)
    Value: "Red" (id: 501)
    Value: "Orange" (id: 502)
    Value: "Brown" (id: 508)
  Character: "Shape" (id: 804, type: categorical)
    Value: "Convex" (id: 509)
    Value: "Flat" (id: 510)
  Character: "Texture" (id: 801, type: categorical)
    Value: "Smooth" (id: 503)
    Value: "Scaly" (id: 504)
  Character: "Diameter" (id: 802, type: range)
    Unit family: "Length" — "cm" (id: 90)

Modifiers:
  Group "Frequency": "Usually" (id: 40, prefix)
  Group "Age": "At maturity" (id: 43, suffix)

Input text: "Pileus: 3–8 cm broad, convex becoming flat at maturity; red to orange; usually smooth. Context white."

Correct output:
{
  "characters": [
    { "kind": "range", "characterId": 802, "traitValues": null, "displayValue": null, "displayMin": 3, "displayMax": 8, "unitId": 90, "modifierIds": [] },
    { "kind": "categorical", "characterId": 804, "traitValues": [{ "traitValueId": 509, "modifierIds": [] }, { "traitValueId": 510, "modifierIds": [43] }], "displayValue": null, "displayMin": null, "displayMax": null, "unitId": null, "modifierIds": null },
    { "kind": "categorical", "characterId": 800, "traitValues": [{ "traitValueId": 501, "modifierIds": [] }, { "traitValueId": 502, "modifierIds": [] }], "displayValue": null, "displayMin": null, "displayMax": null, "unitId": null, "modifierIds": null },
    { "kind": "categorical", "characterId": 801, "traitValues": [{ "traitValueId": 503, "modifierIds": [40] }], "displayValue": null, "displayMin": null, "displayMax": null, "unitId": null, "modifierIds": null }
  ]
}

Key points:
- ALL 4 characters extracted — Diameter, Shape, Color, and Texture each got their own entry.
- "convex becoming flat at maturity" → Shape with two values; "At maturity" modifier on Flat only.
- "red to orange" → Color with two values grouped into ONE entry.
- "Context white" is ignored — it belongs to a different feature.
- Each trait value is assigned to the character it's listed under in the glossary, never to a different character.
- If the text said "fibrillose" but no matching trait value existed, it would go in glossaryGaps: [{ "text": "fibrillose", "reason": "no matching trait value for Texture" }].
- If the text said "somewhat smooth" and the glossary has no modifier for "somewhat", extract Smooth without a modifier and report the gap: [{ "text": "somewhat", "reason": "no matching modifier for degree/intensity" }]. Do NOT substitute "Sometimes" or "Rarely" — those are frequency modifiers, not degree modifiers.
`;

export function buildPerFeatureSystemPrompt(
  glossary: PerFeatureGlossary,
): string {
  return (
    PER_FEATURE_PREAMBLE +
    "\n--- GLOSSARY ---\n\n" +
    buildPerFeatureGlossaryBlock(glossary)
  );
}

export function buildPerFeatureUserPrompt(descriptionText: string): string {
  return `Extract character states for this feature from the following description:\n\n${descriptionText}`;
}

// ── Pass 4: Unmatched sweep ─────────────────────────────────────────

const SWEEP_PREAMBLE = `You are a quality-assurance assistant for a biological taxonomy data extraction pipeline.

A previous step extracted structured character states from a morphological description using per-feature extractors that work in isolation. Your job is twofold:

1. Find morphological information in the original text that was NOT captured by ANY extraction (report in "unmatched").
2. Validate the reported glossary gaps — the per-feature extractors flagged items they couldn't match, but they work in isolation and may report false positives. A gap reported by one feature's extractor may have been successfully captured by another feature's extractor. Confirm only GENUINE gaps where no glossary entry exists (report in "confirmedGlossaryGaps").

Rules for "unmatched":
- Report ONLY morphological traits that are genuinely missing from ALL extractions — do not re-report things already captured under any feature.
- Match FLEXIBLY on word form. The extraction normalizes text: "warts" → "Warty", "smooth" → "Smooth", "scales" → "Scaly". A clause is captured if its meaning is reflected in the extractions under any word form or synonym.
- Use the TEXT-TO-FEATURE ASSIGNMENTS to check coverage. If a clause was assigned to a feature and that feature's extraction includes it, it is covered. But do NOT treat a trait as covered just because a different feature extracted the same value — "Cap: white" and "Stem: white" are independent observations about different structures.
- Pay special attention to modifiers and qualifying language ("on exposure", "when cut", "at maturity", "slightly", "usually"). If the text describes a condition or qualifier that was dropped from the extraction, report it as unmatched.
- Ignore non-morphological text (habitat, distribution, ecology).

IMPORTANT: The two arrays are MUTUALLY EXCLUSIVE. Every item goes in exactly one array — never both.
- "confirmedGlossaryGaps" = the glossary lacks the concept entirely (no character, trait value, or modifier exists for it). Use the GLOSSARY STRUCTURE section to verify — if no character name matches the concept, it is a gap.
- "unmatched" = the glossary COULD express it (a matching character exists in the GLOSSARY STRUCTURE), but the extraction missed it.
If something is a glossary gap, it CANNOT also be unmatched (the extraction can't match what the glossary doesn't have).

Rules for "confirmedGlossaryGaps":
- Review each reported gap from the per-feature extractors (listed in the REPORTED GAPS section).
- A gap is FALSE if the trait was successfully extracted by another feature's extractor — remove it.
- A gap is GENUINE if the morphological concept truly has no matching character, trait value, or modifier in the glossary AND no extractor captured it. Check the GLOSSARY STRUCTURE to verify.
- Also add any NEW gaps you discover that the per-feature extractors missed.

--- EXAMPLE ---

Original text: "Cap: 3–5 cm, convex, fibrillose, with scattered white warts. Gills: adnate; white; close."

Text-to-feature assignments:
- Cap (id: 10): "3–5 cm, convex, fibrillose, with scattered white warts"
- Gills (id: 11): "adnate; white; close"
- Veil Remnants (id: 12): "scattered white warts"

Glossary structure:
- Cap → Shape, Texture, Color, Diameter
- Gills → Attachment, Color, Spacing
- Veil Remnants → Type, Color

Already extracted:
- Cap → Shape: Convex; Diameter: 3–5 cm
- Gills → Attachment: Adnate; Color: White
- Veil Remnants → Type: Warty; Color: White

Reported gaps:
- Cap: "fibrillose — no matching trait value for Texture"
- Cap: "warts — no character for wart structures on cap"

Correct output:
{
  "unmatched": [
    { "text": "Gills: close", "reason": "Gill Spacing not extracted — glossary has a Spacing character but it was not matched." }
  ],
  "confirmedGlossaryGaps": [
    { "text": "fibrillose", "reason": "No trait value for Texture matches 'fibrillose' in any feature's glossary." }
  ]
}

Why:
- "warts" gap from Cap → FALSE POSITIVE. Veil Remnants extracted it as "Warty". Removed.
- "fibrillose" gap from Cap → GENUINE. Glossary structure shows Cap has Texture, but the reported gap says no matching trait value exists. → confirmedGlossaryGaps.
- "close" → Glossary structure shows Gills has Spacing, so the concept IS expressible, but the extraction missed it. → unmatched.
- "fibrillose" is in confirmedGlossaryGaps, NOT unmatched — you cannot miss what the glossary cannot express.
`;

export function buildSweepSystemPrompt(): string {
  return SWEEP_PREAMBLE;
}

export function buildSweepUserPrompt(
  descriptionText: string,
  extractedSummary: string,
  reportedGapsSummary: string,
  segmentationSummary: string,
  glossarySummary: string,
): string {
  let prompt = `Original description:\n\n${descriptionText}\n\n--- GLOSSARY STRUCTURE (features and their characters) ---\n\n${glossarySummary}\n\n--- TEXT-TO-FEATURE ASSIGNMENTS ---\n\nThe segmentation step assigned text to features as follows:\n${segmentationSummary}\n\n--- ALREADY EXTRACTED ---\n\n${extractedSummary}`;
  if (reportedGapsSummary) {
    prompt += `\n\n--- REPORTED GAPS (from per-feature extractors — may include false positives) ---\n\n${reportedGapsSummary}`;
  }
  prompt += `\n\nWhat morphological information from the original description is missing from the extractions above? Which reported gaps are genuine?`;
  return prompt;
}
