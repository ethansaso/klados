import type {
  CategoricalValueSuggestion,
  NumericRangeSuggestion,
  NumericSingleSuggestion,
  TraitSuggestion,
} from "../../../../../../lib/domain/suggestions/types";
import { convertToSI } from "../../../../../../lib/domain/units/conversion";
import type {
  CharacterStateFormValue,
  GroupedCharacterFormValue,
  ModifierTokenFormValue,
} from "./validation";

function updateFeature(
  featureStates: GroupedCharacterFormValue,
  featureId: number,
  updater: (states: CharacterStateFormValue[]) => CharacterStateFormValue[],
): GroupedCharacterFormValue {
  return featureStates.map((g) =>
    g.featureId === featureId ? { ...g, characters: updater(g.characters) } : g,
  );
}

export function addCategoricalStateFromSuggestion(
  featureStates: GroupedCharacterFormValue,
  suggestion: CategoricalValueSuggestion,
): GroupedCharacterFormValue {
  return updateFeature(featureStates, suggestion.featureId, (current) => {
    return [
      ...current,
      {
        kind: "categorical",
        characterId: suggestion.characterId,
        characterLabel: suggestion.characterLabel,
        trait: {
          id: suggestion.traitValueId,
          label: suggestion.traitValueLabel,
          hexCode: suggestion.traitValueHexCode ?? undefined,
        },
        modifiers: [] as ModifierTokenFormValue[],
      },
    ];
  });
}

export function addNumericSingleStateFromSuggestion(
  featureStates: GroupedCharacterFormValue,
  suggestion: NumericSingleSuggestion,
): GroupedCharacterFormValue {
  return updateFeature(featureStates, suggestion.featureId, (current) => {
    // Unitless (dimensionless) character
    if (suggestion.displayUnitId === null) {
      return [
        ...current,
        {
          kind: "number",
          characterId: suggestion.characterId,
          characterLabel: suggestion.characterLabel,
          unit: null,
          siBaseValue: suggestion.value,
          modifiers: [] as ModifierTokenFormValue[],
        },
      ];
    }

    // Has unit - require all unit fields
    if (suggestion.unitLabel === null || suggestion.unitScale === null) {
      return current;
    }

    // Convert to SI base value
    const siBaseValue = convertToSI(suggestion.value, suggestion.unitScale);

    return [
      ...current,
      {
        kind: "number",
        characterId: suggestion.characterId,
        characterLabel: suggestion.characterLabel,
        unit: {
          id: suggestion.displayUnitId,
          symbol: suggestion.unitLabel,
          scale: suggestion.unitScale,
        },
        siBaseValue,
        modifiers: [] as ModifierTokenFormValue[],
      },
    ];
  });
}

export function addNumericRangeStateFromSuggestion(
  featureStates: GroupedCharacterFormValue,
  suggestion: NumericRangeSuggestion,
): GroupedCharacterFormValue {
  return updateFeature(featureStates, suggestion.featureId, (current) => {
    // Unitless (dimensionless) character
    if (suggestion.displayUnitId === null) {
      return [
        ...current,
        {
          kind: "range",
          characterId: suggestion.characterId,
          characterLabel: suggestion.characterLabel,
          unit: null,
          siBaseMin: suggestion.min,
          siBaseMax: suggestion.max,
          modifiers: [] as ModifierTokenFormValue[],
        },
      ];
    }

    // Has unit - require all unit fields
    if (suggestion.unitLabel === null || suggestion.unitScale === null) {
      return current;
    }

    // Convert to SI base values (null for one-sided bounds)
    const siBaseMin =
      suggestion.min !== null
        ? convertToSI(suggestion.min, suggestion.unitScale)
        : null;
    const siBaseMax =
      suggestion.max !== null
        ? convertToSI(suggestion.max, suggestion.unitScale)
        : null;

    return [
      ...current,
      {
        kind: "range",
        characterId: suggestion.characterId,
        characterLabel: suggestion.characterLabel,
        unit: {
          id: suggestion.displayUnitId,
          symbol: suggestion.unitLabel,
          scale: suggestion.unitScale,
        },
        siBaseMin,
        siBaseMax,
        modifiers: [] as ModifierTokenFormValue[],
      },
    ];
  });
}

export function addStateFromSuggestion(
  featureStates: GroupedCharacterFormValue,
  suggestion: TraitSuggestion,
): GroupedCharacterFormValue {
  switch (suggestion.kind) {
    case "categorical-value":
      return addCategoricalStateFromSuggestion(featureStates, suggestion);
    case "numeric-single":
      return addNumericSingleStateFromSuggestion(featureStates, suggestion);
    case "numeric-range":
      return addNumericRangeStateFromSuggestion(featureStates, suggestion);
  }
}

export function removeCategoricalTraitValue(
  featureStates: GroupedCharacterFormValue,
  groupId: number,
  characterId: number,
  stateIndex: number,
): GroupedCharacterFormValue {
  return updateFeature(featureStates, groupId, (current) => {
    let catSeen = -1;
    return current.filter((row) => {
      if (row.kind !== "categorical" || row.characterId !== characterId) return true;
      catSeen += 1;
      return catSeen !== stateIndex;
    });
  });
}

export function updateCategoricalTraitValueModifiers(
  featureStates: GroupedCharacterFormValue,
  featureId: number,
  characterId: number,
  stateIndex: number,
  modifiers: ModifierTokenFormValue[],
): GroupedCharacterFormValue {
  return updateFeature(featureStates, featureId, (current) => {
    let catSeen = -1;
    return current.map((row) => {
      if (row.kind !== "categorical" || row.characterId !== characterId) return row;
      catSeen += 1;
      if (catSeen !== stateIndex) return row;
      return { ...row, modifiers };
    });
  });
}
