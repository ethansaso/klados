import type {
  CategoricalStateDTO,
  CharacterStateDTO,
  FeatureStateDTO,
} from "../states/types";
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
  aStates: CategoricalStateDTO[] | undefined,
  bStates: CategoricalStateDTO[] | undefined,
): {
  aAnnotated: LookalikeComparisonAnnotatedCategoricalState | null;
  bAnnotated: LookalikeComparisonAnnotatedCategoricalState | null;
} {
  if (!aStates?.length && !bStates?.length) {
    return { aAnnotated: null, bAnnotated: null };
  }

  const aVals = (aStates ?? []).map((s) => s.trait);
  const bVals = (bStates ?? []).map((s) => s.trait);

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
  aStates: CharacterStateDTO[] | undefined,
  bStates: CharacterStateDTO[] | undefined,
): {
  aAnnotated: LookalikeComparisonAnnotatedNumberState | null;
  bAnnotated: LookalikeComparisonAnnotatedNumberState | null;
} {
  const aNumbers = (aStates ?? []).filter((s) => s.kind === "number");
  const bNumbers = (bStates ?? []).filter((s) => s.kind === "number");

  if (aNumbers.length === 0 && bNumbers.length === 0) {
    return { aAnnotated: null, bAnnotated: null };
  }

  const aValues = new Set(aNumbers.map((s) => s.siBaseValue));
  const bValues = new Set(bNumbers.map((s) => s.siBaseValue));

  const aAnnotated: LookalikeComparisonAnnotatedNumberState | null =
    aNumbers.length > 0
      ? {
          kind: "number",
          entries: aNumbers.map((s) => ({
            siBaseValue: s.siBaseValue,
            unit: s.unit,
            modifiers: s.modifiers,
            isOverlapping: bValues.has(s.siBaseValue),
          })),
        }
      : null;

  const bAnnotated: LookalikeComparisonAnnotatedNumberState | null =
    bNumbers.length > 0
      ? {
          kind: "number",
          entries: bNumbers.map((s) => ({
            siBaseValue: s.siBaseValue,
            unit: s.unit,
            modifiers: s.modifiers,
            isOverlapping: aValues.has(s.siBaseValue),
          })),
        }
      : null;

  return { aAnnotated, bAnnotated };
}

function buildAnnotatedRangeState(
  aStates: CharacterStateDTO[] | undefined,
  bStates: CharacterStateDTO[] | undefined,
): {
  aAnnotated: LookalikeComparisonAnnotatedRangeState | null;
  bAnnotated: LookalikeComparisonAnnotatedRangeState | null;
} {
  const aRanges = (aStates ?? []).filter((s) => s.kind === "range");
  const bRanges = (bStates ?? []).filter((s) => s.kind === "range");

  if (aRanges.length === 0 && bRanges.length === 0) {
    return { aAnnotated: null, bAnnotated: null };
  }

  // Two ranges overlap if aMin <= bMax AND bMin <= aMax
  function overlapsAny(
    s: (typeof aRanges)[number],
    others: typeof bRanges,
  ): boolean {
    return others.some(
      (o) =>
        s.siBaseMin !== null &&
        s.siBaseMax !== null &&
        o.siBaseMin !== null &&
        o.siBaseMax !== null &&
        s.siBaseMin <= o.siBaseMax &&
        o.siBaseMin <= s.siBaseMax,
    );
  }

  const aAnnotated: LookalikeComparisonAnnotatedRangeState | null =
    aRanges.length > 0
      ? {
          kind: "range",
          entries: aRanges.map((s) => ({
            siBaseMin: s.siBaseMin,
            siBaseMax: s.siBaseMax,
            unit: s.unit,
            modifiers: s.modifiers,
            isOverlapping: overlapsAny(s, bRanges),
          })),
        }
      : null;

  const bAnnotated: LookalikeComparisonAnnotatedRangeState | null =
    bRanges.length > 0
      ? {
          kind: "range",
          entries: bRanges.map((s) => ({
            siBaseMin: s.siBaseMin,
            siBaseMax: s.siBaseMax,
            unit: s.unit,
            modifiers: s.modifiers,
            isOverlapping: overlapsAny(s, aRanges),
          })),
        }
      : null;

  return { aAnnotated, bAnnotated };
}

/** Switch-cased dispatcher for each state kind. */
function buildAnnotatedState(
  aStatesByKind: {
    categorical?: CategoricalStateDTO[];
    others?: CharacterStateDTO[];
  },
  bStatesByKind: {
    categorical?: CategoricalStateDTO[];
    others?: CharacterStateDTO[];
  },
): {
  aAnnotated: LookalikeComparisonAnnotatedState | null;
  bAnnotated: LookalikeComparisonAnnotatedState | null;
} {
  const kind =
    (aStatesByKind.categorical?.length ? "categorical" : undefined) ??
    (bStatesByKind.categorical?.length ? "categorical" : undefined) ??
    aStatesByKind.others?.[0]?.kind ??
    bStatesByKind.others?.[0]?.kind;

  if (!kind) {
    return { aAnnotated: null, bAnnotated: null };
  }

  switch (kind) {
    case "categorical":
      return buildAnnotatedCategoricalState(
        aStatesByKind.categorical,
        bStatesByKind.categorical,
      );
    case "number":
      return buildAnnotatedNumberState(
        aStatesByKind.others,
        bStatesByKind.others,
      );
    case "range":
      return buildAnnotatedRangeState(
        aStatesByKind.others,
        bStatesByKind.others,
      );
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
      // Group categorical states by characterId (flat model: one trait per DTO)
      const aByChar = new Map<
        number,
        {
          categorical?: CategoricalStateDTO[];
          others?: CharacterStateDTO[];
          label: string;
        }
      >();
      const bByChar = new Map<
        number,
        {
          categorical?: CategoricalStateDTO[];
          others?: CharacterStateDTO[];
          label: string;
        }
      >();

      function collectIntoMap(
        map: typeof aByChar,
        states: CharacterStateDTO[],
      ) {
        for (const s of states) {
          const entry = map.get(s.characterId) ?? { label: s.characterLabel };
          if (s.kind === "categorical") {
            entry.categorical = [...(entry.categorical ?? []), s];
          } else {
            entry.others = [...(entry.others ?? []), s];
          }
          map.set(s.characterId, entry);
        }
      }

      collectIntoMap(aByChar, aStates ?? []);
      collectIntoMap(bByChar, bStates ?? []);

      const allCharacterIds = new Set<number>([
        ...aByChar.keys(),
        ...bByChar.keys(),
      ]);

      aCharacters = [];
      bCharacters = [];

      for (const characterId of allCharacterIds) {
        const aEntry = aByChar.get(characterId);
        const bEntry = bByChar.get(characterId);

        const characterLabel = (aEntry ?? bEntry)!.label;

        const { aAnnotated, bAnnotated } = buildAnnotatedState(
          { categorical: aEntry?.categorical, others: aEntry?.others },
          { categorical: bEntry?.categorical, others: bEntry?.others },
        );

        aCharacters.push({
          characterId,
          characterLabel,
          state: aAnnotated,
        });

        bCharacters.push({
          characterId,
          characterLabel,
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
