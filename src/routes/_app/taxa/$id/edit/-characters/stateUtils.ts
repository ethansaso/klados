import type {
  CategoricalValueSuggestion,
  NumericRangeSuggestion,
  NumericSingleSuggestion,
  TraitSuggestion,
} from "../../../../../../lib/api/character-suggestions/types";
import { convertToSI } from "../../../../../../lib/domain/units/conversion";
import type { CharacterStateFormValue } from "./validation";

export function addCategoricalStateFromSuggestion(
  current: CharacterStateFormValue[],
  suggestion: CategoricalValueSuggestion,
): CharacterStateFormValue[] {
  const existing = current.find(
    (row): row is Extract<CharacterStateFormValue, { kind: "categorical" }> =>
      row.kind === "categorical" && row.characterId === suggestion.characterId,
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
    const newRow: CharacterStateFormValue = {
      kind: "categorical",
      characterId: suggestion.characterId,
      characterLabel: suggestion.characterLabel,
      groupId: suggestion.groupId,
      groupLabel: suggestion.groupLabel,
      traitValues: [newTraitValue],
    };
    return [...current, newRow];
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
}

export function addNumericSingleStateFromSuggestion(
  current: CharacterStateFormValue[],
  suggestion: NumericSingleSuggestion,
): CharacterStateFormValue[] {
  // Remove any existing state for this character (replace semantics)
  const filtered = current.filter(
    (row) => row.characterId !== suggestion.characterId,
  );

  // Unitless (dimensionless) character
  if (suggestion.displayUnitId === null) {
    const newRow: CharacterStateFormValue = {
      kind: "number",
      characterId: suggestion.characterId,
      characterLabel: suggestion.characterLabel,
      groupId: suggestion.groupId,
      groupLabel: suggestion.groupLabel,
      unit: null,
      siBaseValue: suggestion.value,
    };
    return [...filtered, newRow];
  }

  // Has unit - require all unit fields
  if (suggestion.unitLabel === null || suggestion.unitScale === null) {
    return current;
  }

  // Convert to SI base value
  const siBaseValue = convertToSI(suggestion.value, suggestion.unitScale);

  const newRow: CharacterStateFormValue = {
    kind: "number",
    characterId: suggestion.characterId,
    characterLabel: suggestion.characterLabel,
    groupId: suggestion.groupId,
    groupLabel: suggestion.groupLabel,
    unit: {
      id: suggestion.displayUnitId,
      symbol: suggestion.unitLabel,
      scale: suggestion.unitScale,
    },
    siBaseValue: siBaseValue,
  };

  return [...filtered, newRow];
}

export function addNumericRangeStateFromSuggestion(
  current: CharacterStateFormValue[],
  suggestion: NumericRangeSuggestion,
): CharacterStateFormValue[] {
  // Remove any existing state for this character (replace semantics)
  const filtered = current.filter(
    (row) => row.characterId !== suggestion.characterId,
  );

  // Unitless (dimensionless) character
  if (suggestion.displayUnitId === null) {
    const newRow: CharacterStateFormValue = {
      kind: "range",
      characterId: suggestion.characterId,
      characterLabel: suggestion.characterLabel,
      groupId: suggestion.groupId,
      groupLabel: suggestion.groupLabel,
      unit: null,
      siBaseMin: suggestion.min,
      siBaseMax: suggestion.max,
    };
    return [...filtered, newRow];
  }

  // Has unit - require all unit fields
  if (suggestion.unitLabel === null || suggestion.unitScale === null) {
    return current;
  }

  // Convert to SI base values
  const siBaseMin = convertToSI(suggestion.min, suggestion.unitScale);
  const siBaseMax = convertToSI(suggestion.max, suggestion.unitScale);

  const newRow: CharacterStateFormValue = {
    kind: "range",
    characterId: suggestion.characterId,
    characterLabel: suggestion.characterLabel,
    groupId: suggestion.groupId,
    groupLabel: suggestion.groupLabel,
    unit: {
      id: suggestion.displayUnitId,
      symbol: suggestion.unitLabel,
      scale: suggestion.unitScale,
    },
    siBaseMin: siBaseMin,
    siBaseMax: siBaseMax,
  };

  return [...filtered, newRow];
}

export function addStateFromSuggestion(
  current: CharacterStateFormValue[],
  suggestion: TraitSuggestion,
): CharacterStateFormValue[] {
  switch (suggestion.kind) {
    case "categorical-value":
      return addCategoricalStateFromSuggestion(current, suggestion);
    case "numeric-single":
      return addNumericSingleStateFromSuggestion(current, suggestion);
    case "numeric-range":
      return addNumericRangeStateFromSuggestion(current, suggestion);
  }
}

export function removeCategoricalTraitValue(
  current: CharacterStateFormValue[],
  characterId: number,
  traitValueId: number,
): CharacterStateFormValue[] {
  return current
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
    });
}

export function removeCharacterState(
  current: CharacterStateFormValue[],
  characterId: number,
): CharacterStateFormValue[] {
  return current.filter((row) => row.characterId !== characterId);
}
