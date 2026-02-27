import type { CharacterStateDTO, FeatureStateDTO } from "../states/types";
import type {
  LookalikeComparisonAnnotatedCategoricalState,
  LookalikeComparisonAnnotatedCategoricalTrait,
  LookalikeComparisonAnnotatedNumberState,
  LookalikeComparisonAnnotatedRangeState,
  LookalikeComparisonAnnotatedState,
  LookalikeComparisonCharacter,
  LookalikeComparisonGroup,
} from "./types";

function traitKey(tv: { canonicalId: number }) {
  return String(tv.canonicalId);
}

/** Treats as overlapping if trait values have any overlap. */
function buildAnnotatedCategoricalState(
  aState: CharacterStateDTO | undefined,
  bState: CharacterStateDTO | undefined,
): {
  aAnnotated: LookalikeComparisonAnnotatedCategoricalState | null;
  bAnnotated: LookalikeComparisonAnnotatedCategoricalState | null;
} {
  if (aState?.kind !== "categorical" && bState?.kind !== "categorical") {
    return { aAnnotated: null, bAnnotated: null };
  }

  const aVals = aState?.kind === "categorical" ? aState.traitValues : [];
  const bVals = bState?.kind === "categorical" ? bState.traitValues : [];

  const aSet = new Set(aVals.map(traitKey));
  const bSet = new Set(bVals.map(traitKey));

  const aTraits: LookalikeComparisonAnnotatedCategoricalTrait[] = aVals.map(
    (tv) => ({
      ...tv,
      isOverlapping: bSet.has(traitKey(tv)),
    }),
  );

  const bTraits: LookalikeComparisonAnnotatedCategoricalTrait[] = bVals.map(
    (tv) => ({
      ...tv,
      isOverlapping: aSet.has(traitKey(tv)),
    }),
  );

  return {
    aAnnotated:
      aTraits.length > 0 ? { kind: "categorical", traits: aTraits } : null,
    bAnnotated:
      bTraits.length > 0 ? { kind: "categorical", traits: bTraits } : null,
  };
}

function buildAnnotatedNumberState(
  aState: CharacterStateDTO | undefined,
  bState: CharacterStateDTO | undefined,
): {
  aAnnotated: LookalikeComparisonAnnotatedNumberState | null;
  bAnnotated: LookalikeComparisonAnnotatedNumberState | null;
} {
  if (aState?.kind !== "number" && bState?.kind !== "number") {
    return { aAnnotated: null, bAnnotated: null };
  }

  const aValue = aState?.kind === "number" ? aState.siBaseValue : null;
  const bValue = bState?.kind === "number" ? bState.siBaseValue : null;

  // epsilon check for identicality (thanks JS)
  const isOverlapping =
    aValue !== null && bValue !== null && Math.abs(aValue - bValue) < 1e-10;

  const aAnnotated: LookalikeComparisonAnnotatedNumberState | null =
    aState?.kind === "number"
      ? {
          kind: "number",
          siBaseValue: aState.siBaseValue,
          unit: aState.unit,
          isOverlapping,
        }
      : null;

  const bAnnotated: LookalikeComparisonAnnotatedNumberState | null =
    bState?.kind === "number"
      ? {
          kind: "number",
          siBaseValue: bState.siBaseValue,
          unit: bState.unit,
          isOverlapping,
        }
      : null;

  return { aAnnotated, bAnnotated };
}

function buildAnnotatedRangeState(
  aState: CharacterStateDTO | undefined,
  bState: CharacterStateDTO | undefined,
): {
  aAnnotated: LookalikeComparisonAnnotatedRangeState | null;
  bAnnotated: LookalikeComparisonAnnotatedRangeState | null;
} {
  if (aState?.kind !== "range" && bState?.kind !== "range") {
    return { aAnnotated: null, bAnnotated: null };
  }

  const aMin = aState?.kind === "range" ? aState.siBaseMin : null;
  const aMax = aState?.kind === "range" ? aState.siBaseMax : null;
  const bMin = bState?.kind === "range" ? bState.siBaseMin : null;
  const bMax = bState?.kind === "range" ? bState.siBaseMax : null;

  // Ranges overlap if: aMin <= bMax AND bMin <= aMax
  const isOverlapping =
    aMin !== null &&
    aMax !== null &&
    bMin !== null &&
    bMax !== null &&
    aMin <= bMax &&
    bMin <= aMax;

  const aAnnotated: LookalikeComparisonAnnotatedRangeState | null =
    aState?.kind === "range"
      ? {
          kind: "range",
          siBaseMin: aState.siBaseMin,
          siBaseMax: aState.siBaseMax,
          unit: aState.unit,
          isOverlapping,
        }
      : null;

  const bAnnotated: LookalikeComparisonAnnotatedRangeState | null =
    bState?.kind === "range"
      ? {
          kind: "range",
          siBaseMin: bState.siBaseMin,
          siBaseMax: bState.siBaseMax,
          unit: bState.unit,
          isOverlapping,
        }
      : null;

  return { aAnnotated, bAnnotated };
}

/** Switch-cased dispatcher for each state kind. */
function buildAnnotatedState(
  aState: CharacterStateDTO | undefined,
  bState: CharacterStateDTO | undefined,
): {
  aAnnotated: LookalikeComparisonAnnotatedState | null;
  bAnnotated: LookalikeComparisonAnnotatedState | null;
} {
  const kind = aState?.kind ?? bState?.kind;

  if (!kind) {
    return { aAnnotated: null, bAnnotated: null };
  }

  switch (kind) {
    case "categorical":
      return buildAnnotatedCategoricalState(aState, bState);
    case "number":
      return buildAnnotatedNumberState(aState, bState);
    case "range":
      return buildAnnotatedRangeState(aState, bState);
  }
}

export function buildGroupedLookalikeStates(args: {
  aGroups: FeatureStateDTO[];
  bGroups: FeatureStateDTO[];
}): LookalikeComparisonGroup[] {
  const { aGroups, bGroups } = args;

  const aByGroup = new Map(aGroups.map((g) => [g.featureId, g]));
  const bByGroup = new Map(bGroups.map((g) => [g.featureId, g]));

  const allGroupIds = new Set<number>([...aByGroup.keys(), ...bByGroup.keys()]);

  const result: LookalikeComparisonGroup[] = [];

  for (const groupId of allGroupIds) {
    const aGroup = aByGroup.get(groupId);
    const bGroup = bByGroup.get(groupId);

    const groupLabel = aGroup?.featureLabel ?? bGroup?.featureLabel ?? "";
    const aStates = aGroup?.states ?? null;
    const bStates = bGroup?.states ?? null;

    let aCharacters: LookalikeComparisonCharacter[] | null = null;
    let bCharacters: LookalikeComparisonCharacter[] | null = null;

    if (aStates !== null || bStates !== null) {
      const aByChar = new Map((aStates ?? []).map((s) => [s.characterId, s]));
      const bByChar = new Map((bStates ?? []).map((s) => [s.characterId, s]));

      const allCharacterIds = new Set<number>([
        ...aByChar.keys(),
        ...bByChar.keys(),
      ]);

      aCharacters = [];
      bCharacters = [];

      for (const characterId of allCharacterIds) {
        const aState = aByChar.get(characterId);
        const bState = bByChar.get(characterId);

        const metaState = aState ?? bState;
        if (!metaState) continue; // defensive, should not happen

        const { aAnnotated, bAnnotated } = buildAnnotatedState(aState, bState);

        aCharacters.push({
          characterId,
          characterLabel: metaState.characterLabel,
          state: aAnnotated,
        });

        bCharacters.push({
          characterId,
          characterLabel: metaState.characterLabel,
          state: bAnnotated,
        });
      }

      aCharacters.sort((a, b) =>
        a.characterLabel.localeCompare(b.characterLabel),
      );
      bCharacters.sort((a, b) =>
        a.characterLabel.localeCompare(b.characterLabel),
      );
    }

    result.push({
      groupId,
      groupLabel,
      aCharacters,
      bCharacters,
    });
  }

  result.sort((a, b) => a.groupLabel.localeCompare(b.groupLabel));
  return result;
}
