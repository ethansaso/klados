import { v4 as uuidv4 } from "uuid";
import type {
  CategoricalValueSuggestion,
  NumericRangeSuggestion,
  NumericSingleSuggestion,
  TraitSuggestion,
} from "../../../../../../lib/domain/suggestions/types";
import { convertToSI } from "../../../../../../lib/domain/units/utils";
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
  featureId: number,
  suggestion: CategoricalValueSuggestion,
): GroupedCharacterFormValue {
  return updateFeature(featureStates, featureId, (current) => {
    return [
      ...current,
      {
        kind: "categorical",
        _formId: uuidv4(),
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
  featureId: number,
  suggestion: NumericSingleSuggestion,
): GroupedCharacterFormValue {
  return updateFeature(featureStates, featureId, (current) => {
    // Unitless (dimensionless) character
    if (suggestion.displayUnitId === null) {
      return [
        ...current,
        {
          kind: "number",
          _formId: uuidv4(),
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
        _formId: uuidv4(),
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
  featureId: number,
  suggestion: NumericRangeSuggestion,
): GroupedCharacterFormValue {
  return updateFeature(featureStates, featureId, (current) => {
    // Unitless (dimensionless) character
    if (suggestion.displayUnitId === null) {
      return [
        ...current,
        {
          kind: "range",
          _formId: uuidv4(),
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
        _formId: uuidv4(),
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

/** The caller scoped the search to a feature, so it supplies that feature here. */
export function addStateFromSuggestion(
  featureStates: GroupedCharacterFormValue,
  featureId: number,
  suggestion: TraitSuggestion,
): GroupedCharacterFormValue {
  switch (suggestion.kind) {
    case "categorical-value":
      return addCategoricalStateFromSuggestion(
        featureStates,
        featureId,
        suggestion,
      );
    case "numeric-single":
      return addNumericSingleStateFromSuggestion(
        featureStates,
        featureId,
        suggestion,
      );
    case "numeric-range":
      return addNumericRangeStateFromSuggestion(
        featureStates,
        featureId,
        suggestion,
      );
  }
}

export function removeState(
  featureStates: GroupedCharacterFormValue,
  featureId: number,
  formId: string,
): GroupedCharacterFormValue {
  return updateFeature(featureStates, featureId, (current) =>
    current.filter((state) => state._formId !== formId),
  );
}

export function updateStateModifiers(
  featureStates: GroupedCharacterFormValue,
  featureId: number,
  formId: string,
  modifiers: ModifierTokenFormValue[],
): GroupedCharacterFormValue {
  return updateFeature(featureStates, featureId, (current) =>
    current.map((state) =>
      state._formId === formId ? { ...state, modifiers } : state,
    ),
  );
}

/**
 * Moves a character's states within its list.
 * Other states keep their positions in the flat array.
 */
export function moveCharacterState(
  featureStates: GroupedCharacterFormValue,
  featureId: number,
  characterId: number,
  fromIndex: number,
  toIndex: number,
): GroupedCharacterFormValue {
  return updateFeature(featureStates, featureId, (current) => {
    const reordered = current.filter((s) => s.characterId === characterId);
    const [moved] = reordered.splice(fromIndex, 1);
    if (!moved) return current;
    reordered.splice(toIndex, 0, moved);

    let next = 0;
    return current.map((s) =>
      s.characterId === characterId ? reordered[next++]! : s,
    );
  });
}
