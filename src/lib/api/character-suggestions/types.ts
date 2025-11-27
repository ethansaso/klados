// Shared character context for all suggestions.
type BaseCharacterContext = {
  characterId: number;
  characterLabel: string; // "Cap color", "Cap diameter"
  groupId: number;
  groupLabel: string; // "Cap", "Gills", etc.
};

export type CategoricalValueSuggestion = BaseCharacterContext & {
  kind: "categorical-value";
  traitValueId: number;
  traitValueLabel: string; // "Red"
};
export type NumericSingleSuggestion = BaseCharacterContext & {
  kind: "numeric-single";
  value: number; // e.g. 10
  unitLabel: string; // "cm", "mm", "µm", "count"
  displayValue: string; // "10 cm"
};
export type NumericRangeSuggestion = BaseCharacterContext & {
  kind: "numeric-range";
  min: number; // e.g. 7
  max: number; // e.g. 9
  unitLabel: string; // "µm", "cm", etc.
  displayValue: string; // "7-9 µm"
};

/**
 * Union type containing all suggestions for traits.
 * Intended for use in character editing UIs.
 */
export type TraitSuggestion =
  | CategoricalValueSuggestion
  | NumericSingleSuggestion
  | NumericRangeSuggestion;
