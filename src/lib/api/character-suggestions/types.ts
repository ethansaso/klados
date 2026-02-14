// Shared character context for all suggestions.
type BaseCharacterContext = {
  characterId: number;
  characterLabel: string; // "Cap color", "Cap diameter"
  featureId: number;
  featureLabel: string; // "Cap", "Gills", etc.
};
// Base type for numeric suggestions.
type BaseNumericSuggestion = BaseCharacterContext & {
  // Which unit to use for display/re-entry if it was resolved from the query. Null if incomplete/unknown.
  displayUnitId: number | null;
  // Family unit belongs to
  unitFamilyId: number;

  unitLabel: string | null; // prefer unit.symbol (e.g. "µm")
  unitKey: string | null; // ascii-safe key (e.g. "um")
  unitScale: string | null; // e.g. "0.001" for "mm"
};

export type CategoricalValueSuggestion = BaseCharacterContext & {
  kind: "categorical-value";
  traitValueId: number;
  traitValueLabel: string; // "Red"
  traitValueHexCode: string | null; // "#FF0000" or null
};
export type NumericSingleSuggestion = BaseNumericSuggestion & {
  kind: "numeric-single";
  value: number; // e.g. 10
  displayValue: string; // "10 µm" or "10"
};
export type NumericRangeSuggestion = BaseNumericSuggestion & {
  kind: "numeric-range";
  min: number; // e.g. 7
  max: number; // e.g. 9
  displayValue: string; // "7–9 µm" or "7–9"
};

/**
 * Union type containing all suggestions for traits.
 * Intended for use in character editing UIs.
 */
export type TraitSuggestion =
  | CategoricalValueSuggestion
  | NumericSingleSuggestion
  | NumericRangeSuggestion;
