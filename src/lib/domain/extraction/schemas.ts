import z from "zod";

// ── Step 1: Structured observations (glossary-free) ─────────────────

export const structuredObservationsSchema = z.object({
  observations: z.array(
    z.object({
      /** The anatomical structure being described (e.g. "cap", "stem", "gills"). */
      structure: z.string(),
      /** The verbatim text from the description for this observation. */
      verbatimText: z.string(),
      /** Structured sub-observations extracted from the text. */
      observations: z.array(
        z.object({
          /** What property is described (e.g. "color", "shape", "texture", "size"). */
          property: z.string(),
          /** The value(s) observed, in natural language. */
          value: z.string(),
          /** Any qualifiers like "usually", "somewhat", "at maturity", "when fresh". */
          qualifiers: z.array(z.string()),
        }),
      ),
      /** Concept keywords for matching to features — synonyms, related terms, hypernyms. */
      concepts: z.array(z.string()),
    }),
  ),
});

export type StructuredObservations = z.infer<
  typeof structuredObservationsSchema
>;

// ── Step 2: Feature request (names only) ────────────────────────────

export const featureRequestSchema = z.object({
  /** IDs of features the LLM wants to see details for. */
  requestedFeatureIds: z.array(z.number().int()),
});

export type FeatureRequest = z.infer<typeof featureRequestSchema>;

// ── Step 3: Feature narrowing (with descriptions) ───────────────────

export const featureNarrowingSchema = z.object({
  /** Final selected feature IDs after reviewing descriptions. */
  selectedFeatureIds: z.array(z.number().int()),
  /** Mapping of sub-observations to feature IDs. Different sub-observations within the same structure can map to different features. */
  observationToFeatures: z.array(
    z.object({
      /** Index into the observations array from Step 1. */
      observationIndex: z.number().int(),
      /** Indices into the sub-observations array of that structure. */
      subObservationIndices: z.array(z.number().int()),
      /** Feature IDs these sub-observations map to. */
      featureIds: z.array(z.number().int()),
    }),
  ),
});

export type FeatureNarrowing = z.infer<typeof featureNarrowingSchema>;

// ── Step 4: State extraction (with characters + trait values) ───────

const characterExtractionSchema = z.object({
  kind: z.enum(["categorical", "number", "range"]),
  characterId: z.number().int(),
  /** Required when kind is "categorical", null otherwise. */
  traitValues: z
    .array(
      z.object({
        traitValueId: z.number().int(),
        /** Qualifier text from the description that should map to modifiers. Empty array if none. */
        qualifiers: z.array(z.string()),
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
  /** Qualifier text from the description that should map to modifiers. Used for "number" and "range" kinds, null for "categorical". */
  qualifiers: z.array(z.string()).nullable(),
});

const glossaryGapSchema = z.object({
  /** The verbatim snippet from the text that couldn't be matched. */
  text: z.string(),
  /** What kind of glossary entry is missing. */
  reason: z.string(),
});

export const stateExtractionSchema = z.object({
  characters: z.array(characterExtractionSchema),
  /** Text snippets that describe morphological traits but have no matching character or trait value in the glossary. */
  glossaryGaps: z.array(glossaryGapSchema),
});

export type CharacterExtraction = z.infer<typeof characterExtractionSchema>;
export type GlossaryGap = z.infer<typeof glossaryGapSchema>;
export type StateExtraction = z.infer<typeof stateExtractionSchema>;

// ── Step 5: Modifier request (group names only) ─────────────────────

export const modifierRequestSchema = z.object({
  /** IDs of modifier groups the LLM wants to see values for. */
  requestedGroupIds: z.array(z.number().int()),
});

export type ModifierRequest = z.infer<typeof modifierRequestSchema>;

// ── Step 6: Modifier assignment ─────────────────────────────────────

export const modifierAssignmentResultSchema = z.object({
  assignments: z.array(
    z.object({
      /** Index into the characters array from Step 4. */
      characterIndex: z.number().int(),
      /** For categorical: index into the traitValues array of that character. Null for numeric/range. */
      traitValueIndex: z.number().int().nullable(),
      /** Modifier IDs to attach. */
      modifierIds: z.array(z.number().int()),
      /** Qualifiers from the text that could not be matched to any modifier. */
      unmatchedQualifiers: z.array(z.string()),
    }),
  ),
});

export type ModifierAssignmentResult = z.infer<
  typeof modifierAssignmentResultSchema
>;

// ── Step 7: Verification sweep ──────────────────────────────────────

const unmatchedEntrySchema = z.object({
  /** The original snippet from the source text that wasn't captured. */
  text: z.string(),
  /** Why it wasn't captured. */
  reason: z.string(),
  /** The feature ID that should have captured this trait. */
  featureId: z.number().int(),
});

export const verificationSweepSchema = z.object({
  /** Morphological traits present in the text that the extraction missed but COULD have captured. */
  unmatched: z.array(unmatchedEntrySchema),
  /** Morphological traits in the text with no matching glossary entry at all. */
  glossaryGaps: z.array(glossaryGapSchema),
});

export type UnmatchedEntry = z.infer<typeof unmatchedEntrySchema>;
export type VerificationSweepResult = z.infer<typeof verificationSweepSchema>;
