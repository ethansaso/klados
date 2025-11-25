import { CategoricalValueSuggestion } from "../../../../../../lib/serverFns/character-suggestions/types";
import { CharacterStateFormValue } from "./validation";

export function addCategoricalStateFromSuggestion(
  current: CharacterStateFormValue[],
  suggestion: CategoricalValueSuggestion
): CharacterStateFormValue[] {
  const existing = current.find(
    (row) =>
      row.kind === "categorical" && row.characterId === suggestion.characterId
  );

  if (
    existing &&
    existing.traitValues.some((tv) => tv.id === suggestion.traitValueId)
  ) {
    return current;
  }

  if (!existing) {
    const newRow: CharacterStateFormValue = {
      kind: "categorical",
      characterId: suggestion.characterId,
      groupId: suggestion.groupId,
      traitValues: [
        { id: suggestion.traitValueId, label: suggestion.traitValueLabel },
      ],
    };
    return [...current, newRow];
  }

  const next = current.map((row) => {
    if (
      row.kind === "categorical" &&
      row.characterId === suggestion.characterId
    ) {
      return {
        ...row,
        traitValues: [
          ...row.traitValues,
          { id: suggestion.traitValueId, label: suggestion.traitValueLabel },
        ],
      };
    }
    return row;
  });

  return next;
}

export function removeCategoricalTraitValue(
  all: CharacterStateFormValue[],
  characterId: number,
  traitValueId: number
): CharacterStateFormValue[] {
  return (
    all
      .map((row) => {
        if (row.kind !== "categorical" || row.characterId !== characterId) {
          return row;
        }

        const nextTraits = row.traitValues.filter(
          (tv) => tv.id !== traitValueId
        );
        if (nextTraits.length === row.traitValues.length) {
          return row;
        }

        return { ...row, traitValues: nextTraits };
      })
      // Optionally drop empty categorical rows for this character
      .filter(
        (row) =>
          row.kind !== "categorical" ||
          row.characterId !== characterId ||
          row.traitValues.length > 0
      )
  );
}
