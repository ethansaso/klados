# ML Text-to-State Extraction

Ingests prose morphological descriptions and extracts structured character states against the existing glossary. Unmatched content is surfaced to the user — no auto-creation of glossary entries.

## Pipeline

### 1. Feature Segmentation

LLM segments raw text into feature-scoped chunks using the `feature` table labels as a closed vocabulary.

**Input**: full description + flat list of feature labels from DB.
**Output**: `{ featureLabel, rawText }[]` + any segments referencing unknown features → unmatched pile.

Validate each `featureLabel` against DB. Resolve hierarchy/aliases where possible.

### 2. Glossary Context Loading

Per matched feature, load scoped vocabulary:

```
character_feature WHERE featureId = X
  → character IDs
    → categorical: categorical_trait_value WHERE characterId IN (...)
    → numeric: numeric_character_meta + unit_family + units
  → global: modifier_group + modifier_value (all groups, applies across characters)
```

Typical scale: 2–10 characters/feature, 10–500 traits/character. Fits comfortably in a single LLM context window per feature.

### 3. Per-Feature Extraction

LLM receives the raw text segment + scoped glossary (character labels/IDs, trait value labels/IDs, modifier labels/IDs/affix types). Returns structured JSON selecting from the provided IDs:

```json
{
  "featureId": 5,
  "matched": [
    {
      "characterId": 12,
      "type": "categorical",
      "traits": [
        { "traitValueId": 45, "modifiers": [] },
        { "traitValueId": 47, "modifiers": [{ "modifierId": 8 }] }
      ]
    },
    {
      "characterId": 14,
      "type": "range",
      "min": 0.03, "max": 0.08,
      "displayUnitId": 2,
      "modifiers": []
    }
  ],
  "unmatched": ["viscid when moist"]
}
```

This is constrained classification, not open-ended NLP — the model picks from closed ID lists.

Numeric extraction can optionally be done deterministically first (regex for `N–M unit` patterns, SI conversion via `unit.scale`), leaving only categorical content for the LLM.

### 4. Validation

- **ID existence**: every traitValueId/characterId/modifierId exists and belongs to the correct parent
- **Type consistency**: categorical characters have traits, numeric characters have values
- **Constraints**: range min ≤ max, single-select characters have one trait
- **SI conversion**: `value × unit.scale` → `siBaseValue` / `siBaseMin` / `siBaseMax`

Failures join the unmatched pile.

### 5. User Review

Present matched states alongside raw text. User accepts/rejects/edits individual extractions. Unmatched text shown verbatim for manual handling.

On confirmation, write through existing `replaceGroupedCharacterStatesForTaxon` — same atomic replacement the edit form uses. Zero new write logic.

## Unmatched Content Handling

No auto-creation of glossary entries. Anything that can't be confidently mapped is surfaced to the user:

- Unknown feature labels (not in `feature` table)
- Trait phrases with no matching `categorical_trait_value`
- Modifier phrases that couldn't be decomposed
- Feature-level absence assertions ("gills absent") — surfaced as a distinct category since absence = no `taxon_feature_state` row

User can manually add states, create missing glossary entries and re-run, or ignore.

## Codebase Layout

| Path | Purpose |
|------|---------|
| `src/ml/` | Prompt templates, LLM client |
| `src/lib/api/ml/extractStatesFn.ts` | Server function: accepts `{ taxonId, rawText, sourceId? }`, returns `{ matched, unmatched }` |
| `src/lib/domain/ml/` | Glossary context loader (queries character/trait/modifier vocab per feature) |
| Review UI (TBD) | Modal in taxon edit page or dedicated route; calls `updateTaxonFn` with accepted states |

## Open Decisions

- **LLM provider**: any model with structured output / JSON mode. API (OpenAI/Anthropic) fastest to validate; fine-tuned small model viable given constrained vocab.
- **Batch mode**: for importing field guides (many species), queue extractions and produce a review list vs. interactive single-description mode in the editor.
- **Feature absence**: currently implicit (no `taxon_feature_state` row). Surface detected absences for user confirmation; no schema change needed.
- **Source linkage**: if user provides a `sourceId`, auto-create `taxon_source` link for provenance.
- **Prompt versioning**: store templates as versioned assets to iterate without breaking behavior.


# Garbage bin
User text
  → extractStatesFn (server fn, step 6)
    → extractStatesFromText (orchestrator, step 5)
      → listAllFeatureLabels() (existing service + new unpaginated fn, step 1)
      → segmentDescription() (LLM call, step 4)
      → for each feature:
          → getFeature() (existing service)
          → listAllTraitValuesForCharacter() (existing service + new fn, step 1)
          → listAllModifiers() (existing service + new fn, step 1)
          → buildExtractionPrompt() (prompt builder, step 3)
          → extractStatesForFeature() (LLM call, step 4)
      → validate IDs against loaded data
      → return { matched: CharacterByFeatureUpdate, unmatched }
  → UI renders review
  → user confirms
  → updateTaxonFn (existing) with matched states