import type {
  CategoricalValueSuggestion,
  NumericRangeSuggestion,
  NumericSingleSuggestion,
  TraitSuggestion,
} from "../../../../../../lib/api/character-suggestions/types";
import { convertToSI } from "../../../../../../lib/domain/units/conversion";
import type {
  CharacterStateFormValue,
  GroupedCharacterFormValue,
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
    const existing = current.find(
      (row): row is Extract<CharacterStateFormValue, { kind: "categorical" }> =>
        row.kind === "categorical" &&
        row.characterId === suggestion.characterId,
    );

    // Already has this trait value
    if (existing?.traitValues.some((tv) => tv.id === suggestion.traitValueId)) {
      return current;
    }

    const newTraitValue = {
      id: suggestion.traitValueId,
      label: suggestion.traitValueLabel,
      hexCode: suggestion.traitValueHexCode ?? undefined,
    };

    // Create new categorical state
    if (!existing) {
      return [
        ...current,
        {
          kind: "categorical",
          characterId: suggestion.characterId,
          characterLabel: suggestion.characterLabel,
          traitValues: [newTraitValue],
        },
      ];
    }

    // Add to existing categorical state
    return current.map((row) => {
      if (
        row.kind === "categorical" &&
        row.characterId === suggestion.characterId
      ) {
        return {
          ...row,
          traitValues: [...row.traitValues, newTraitValue],
        };
      }
      return row;
    });
  });
}

export function addNumericSingleStateFromSuggestion(
  featureStates: GroupedCharacterFormValue,
  suggestion: NumericSingleSuggestion,
): GroupedCharacterFormValue {
  return updateFeature(featureStates, suggestion.featureId, (current) => {
    // Remove any existing state for this character (replace semantics)
    const filtered = current.filter(
      (row) => row.characterId !== suggestion.characterId,
    );

    // Unitless (dimensionless) character
    if (suggestion.displayUnitId === null) {
      return [
        ...filtered,
        {
          kind: "number",
          characterId: suggestion.characterId,
          characterLabel: suggestion.characterLabel,
          unit: null,
          siBaseValue: suggestion.value,
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
      ...filtered,
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
      },
    ];
  });
}

export function addNumericRangeStateFromSuggestion(
  featureStates: GroupedCharacterFormValue,
  suggestion: NumericRangeSuggestion,
): GroupedCharacterFormValue {
  return updateFeature(featureStates, suggestion.featureId, (current) => {
    // Remove any existing state for this character (replace semantics)
    const filtered = current.filter(
      (row) => row.characterId !== suggestion.characterId,
    );

    // Unitless (dimensionless) character
    if (suggestion.displayUnitId === null) {
      return [
        ...filtered,
        {
          kind: "range",
          characterId: suggestion.characterId,
          characterLabel: suggestion.characterLabel,
          unit: null,
          siBaseMin: suggestion.min,
          siBaseMax: suggestion.max,
        },
      ];
    }

    // Has unit - require all unit fields
    if (suggestion.unitLabel === null || suggestion.unitScale === null) {
      return current;
    }

    // Convert to SI base values
    const siBaseMin = convertToSI(suggestion.min, suggestion.unitScale);
    const siBaseMax = convertToSI(suggestion.max, suggestion.unitScale);

    return [
      ...filtered,
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
  traitValueId: number,
): GroupedCharacterFormValue {
  return updateFeature(featureStates, groupId, (current) =>
    current
      .map((row) => {
        if (row.kind !== "categorical" || row.characterId !== characterId) {
          return row;
        }
        return {
          ...row,
          traitValues: row.traitValues.filter((tv) => tv.id !== traitValueId),
        };
      })
      .filter((row) => {
        // Remove categorical rows with no trait values
        if (row.kind === "categorical") {
          return row.traitValues.length > 0;
        }
        return true;
      }),
  );
}

export function removeCharacterState(
  featureStates: GroupedCharacterFormValue,
  groupId: number,
  characterId: number,
): GroupedCharacterFormValue {
  return updateFeature(featureStates, groupId, (current) =>
    current.filter((row) => row.characterId !== characterId),
  );
}
