/**
 * Shared character context for all suggestions.
 */
type BaseCharacterContext = {
  characterId: number;
  characterLabel: string; // "Cap color", "Cap diameter"
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
  traitValueLabel: string; // "red"
  traitValueDescription: string; // may be ""
  traitValueHexCode: string | null; // "#FF0000" or null
};

export type NumericSingleSuggestion = BaseNumericSuggestion & {
  kind: "numeric-single";
  value: number; // e.g. 10
  displayValue: string; // "10 µm" or "10"
};

export type NumericRangeSuggestion = BaseNumericSuggestion & {
  kind: "numeric-range";
  min: number | null; // null for upper-bound-only (e.g. "< 3 cm")
  max: number | null; // null for lower-bound-only (e.g. "> 3 cm")
  displayValue: string; // "7–9 µm", "≥ 3 µm", "≤ 9 µm"
};

/**
 * Union type containing all suggestions for traits.
 * Intended for use in character editing UIs.
 */
export type TraitSuggestion =
  CategoricalValueSuggestion | NumericSingleSuggestion | NumericRangeSuggestion;

/**
 * A suggestion for modifier values.
 * Scoped only by the query string (modifiers are not tied to features/characters).
 */
export type ModifierSuggestion = {
  kind: "modifier";
  id: number;
  label: string; // e.g. "at apex"
  affixType: "prefix" | "suffix";
  groupId: number;
  groupLabel: string; // e.g. "Position"
};

/** A feature suggestion for typeahead pickers. */
export type FeatureSuggestion = {
  id: number;
  label: string;
  description: string;
};
