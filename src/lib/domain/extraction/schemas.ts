import z from "zod";

// ── Pass 1: Feature selection ───────────────────────────────────────

export const featureSelectionSchema = z.object({
  featureIds: z
    .array(z.number().int())
    .describe("IDs of features relevant to the description"),
});

export type FeatureSelection = z.infer<typeof featureSelectionSchema>;

// ── Pass 2: Text segmentation ───────────────────────────────────────

export const textSegmentationSchema = z.object({
  segments: z.array(
    z.object({
      featureId: z.number().int(),
      text: z
        .string()
        .describe(
          "The verbatim text snippets from the description that pertain to this feature, concatenated with spaces.",
        ),
    }),
  ),
  /** Morphological text that could not be assigned to any of the selected features. */
  unassignedText: z.array(
    z.object({
      text: z.string().describe("The verbatim unassigned text snippet."),
      reason: z
        .string()
        .describe(
          "Why it couldn't be assigned (e.g. 'no matching feature for lamellar trama').",
        ),
    }),
  ),
});

export type TextSegmentation = z.infer<typeof textSegmentationSchema>;

// ── Pass 3: State extraction ────────────────────────────────────────

const characterExtractionSchema = z.object({
  kind: z.enum(["categorical", "number", "range"]),
  characterId: z.number().int(),
  /** Required when kind is "categorical", null otherwise. */
  traitValues: z
    .array(
      z.object({
        traitValueId: z.number().int(),
        modifierIds: z.array(z.number().int()),
      }),
    )
    .nullable(),
  /** Value in the display unit. Required when kind is "number", null otherwise. */
  displayValue: z.number().nullable(),
  /** Lower bound in the display unit. Used when kind is "range", null otherwise. */
  displayMin: z.number().nullable(),
  /** Upper bound in the display unit. Used when kind is "range", null otherwise. */
  displayMax: z.number().nullable(),
  /** Unit ID from the glossary. Used for "number" and "range" kinds, null for "categorical". */
  unitId: z.number().int().nullable(),
  /** Modifier IDs. Used for "number" and "range" kinds, null for "categorical". */
  modifierIds: z.array(z.number().int()).nullable(),
});

const unmatchedEntrySchema = z.object({
  /** The original snippet from the source text that couldn't be resolved. */
  text: z.string(),
  /** Why it couldn't be matched (e.g. "no matching trait value", "unknown unit"). */
  reason: z.string(),
});

const glossaryGapSchema = z.object({
  /** The verbatim snippet from the text that couldn't be matched. */
  text: z.string(),
  /** What kind of glossary entry is missing (e.g. "no matching trait value for 'short-gills'"). */
  reason: z.string(),
});

export const perFeatureResultSchema = z.object({
  characters: z.array(characterExtractionSchema),
  /** Text snippets that describe morphological traits but have no matching character or trait value in the glossary. */
  glossaryGaps: z.array(glossaryGapSchema),
});

export const unmatchedSweepSchema = z.object({
  /** Morphological traits present in the text that the extraction missed but COULD have captured given the glossary. */
  unmatched: z.array(unmatchedEntrySchema),
  /** Confirmed glossary gaps — morphological traits in the text with no matching glossary entry, verified against ALL feature extractions. */
  confirmedGlossaryGaps: z.array(glossaryGapSchema),
});

export type CharacterExtraction = z.infer<typeof characterExtractionSchema>;
export type GlossaryGap = z.infer<typeof glossaryGapSchema>;
export type UnmatchedEntry = z.infer<typeof unmatchedEntrySchema>;
export type PerFeatureResult = z.infer<typeof perFeatureResultSchema>;
export type UnmatchedSweepResult = z.infer<typeof unmatchedSweepSchema>;
