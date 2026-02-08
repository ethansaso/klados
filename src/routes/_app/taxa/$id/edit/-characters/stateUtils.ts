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

function updateGroup(
  groups: GroupedCharacterFormValue,
  groupId: number,
  updater: (states: CharacterStateFormValue[]) => CharacterStateFormValue[],
): GroupedCharacterFormValue {
  return groups.map((g) =>
    g.groupId === groupId ? { ...g, characters: updater(g.characters) } : g,
  );
}

export function addCategoricalStateFromSuggestion(
  groups: GroupedCharacterFormValue,
  suggestion: CategoricalValueSuggestion,
): GroupedCharacterFormValue {
  return updateGroup(groups, suggestion.groupId, (current) => {
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
  groups: GroupedCharacterFormValue,
  suggestion: NumericSingleSuggestion,
): GroupedCharacterFormValue {
  return updateGroup(groups, suggestion.groupId, (current) => {
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
  groups: GroupedCharacterFormValue,
  suggestion: NumericRangeSuggestion,
): GroupedCharacterFormValue {
  return updateGroup(groups, suggestion.groupId, (current) => {
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
  groups: GroupedCharacterFormValue,
  suggestion: TraitSuggestion,
): GroupedCharacterFormValue {
  switch (suggestion.kind) {
    case "categorical-value":
      return addCategoricalStateFromSuggestion(groups, suggestion);
    case "numeric-single":
      return addNumericSingleStateFromSuggestion(groups, suggestion);
    case "numeric-range":
      return addNumericRangeStateFromSuggestion(groups, suggestion);
  }
}

export function removeCategoricalTraitValue(
  groups: GroupedCharacterFormValue,
  groupId: number,
  characterId: number,
  traitValueId: number,
): GroupedCharacterFormValue {
  return updateGroup(groups, groupId, (current) =>
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
  groups: GroupedCharacterFormValue,
  groupId: number,
  characterId: number,
): GroupedCharacterFormValue {
  return updateGroup(groups, groupId, (current) =>
    current.filter((row) => row.characterId !== characterId),
  );
}
