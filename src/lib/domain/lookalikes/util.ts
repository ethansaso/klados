import { TaxonCharacterStateDTO } from "../character-states/types";
import {
  LookalikeComparisonAnnotatedCategoricalState,
  LookalikeComparisonAnnotatedCategoricalTrait,
  LookalikeComparisonAnnotatedNumberState,
  LookalikeComparisonAnnotatedRangeState,
  LookalikeComparisonAnnotatedState,
  LookalikeComparisonGroup,
} from "./types";

function traitKey(tv: { canonicalId: number }) {
  return String(tv.canonicalId);
}

/** Treats as overlapping if trait values have any overlap. */
function buildAnnotatedCategoricalState(
  aState: TaxonCharacterStateDTO | undefined,
  bState: TaxonCharacterStateDTO | undefined,
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
  aState: TaxonCharacterStateDTO | undefined,
  bState: TaxonCharacterStateDTO | undefined,
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
  aState: TaxonCharacterStateDTO | undefined,
  bState: TaxonCharacterStateDTO | undefined,
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
  aState: TaxonCharacterStateDTO | undefined,
  bState: TaxonCharacterStateDTO | undefined,
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
  aStates: TaxonCharacterStateDTO[];
  bStates: TaxonCharacterStateDTO[];
}): LookalikeComparisonGroup[] {
  const { aStates, bStates } = args;

  const aByChar = new Map(aStates.map((s) => [s.characterId, s]));
  const bByChar = new Map(bStates.map((s) => [s.characterId, s]));

  // Collect all unique characterIds from both taxa
  const allCharacterIds = new Set([
    ...aStates.map((s) => s.characterId),
    ...bStates.map((s) => s.characterId),
  ]);

  // Build a lookup for character metadata from whichever state has it
  const characterMeta = new Map<
    number,
    {
      characterId: number;
      characterLabel: string;
      groupId: number;
      groupLabel: string;
    }
  >();

  for (const state of [...aStates, ...bStates]) {
    if (!characterMeta.has(state.characterId)) {
      characterMeta.set(state.characterId, {
        characterId: state.characterId,
        characterLabel: state.characterLabel,
        groupId: state.groupId,
        groupLabel: state.groupLabel,
      });
    }
  }

  const groups = new Map<number, LookalikeComparisonGroup>();

  for (const characterId of allCharacterIds) {
    const meta = characterMeta.get(characterId);
    if (!meta) continue; // Shouldn't happen

    const aState = aByChar.get(characterId);
    const bState = bByChar.get(characterId);

    const { aAnnotated, bAnnotated } = buildAnnotatedState(aState, bState);

    let group = groups.get(meta.groupId);
    if (!group) {
      group = {
        groupId: meta.groupId,
        groupLabel: meta.groupLabel,
        aCharacters: [],
        bCharacters: [],
      };
      groups.set(meta.groupId, group);
    }

    group.aCharacters.push({
      characterId: meta.characterId,
      characterLabel: meta.characterLabel,
      state: aAnnotated,
    });

    group.bCharacters.push({
      characterId: meta.characterId,
      characterLabel: meta.characterLabel,
      state: bAnnotated,
    });
  }

  // Sort groups by label, and characters within groups by label
  const result = Array.from(groups.values());
  result.sort((a, b) => a.groupLabel.localeCompare(b.groupLabel));

  for (const group of result) {
    group.aCharacters.sort((a, b) =>
      a.characterLabel.localeCompare(b.characterLabel),
    );
    group.bCharacters.sort((a, b) =>
      a.characterLabel.localeCompare(b.characterLabel),
    );
  }

  return result;
}
