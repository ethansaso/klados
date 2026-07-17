import type { CharacterStateDTO, FeatureStateDTO } from "../states/types";
import type {
  LookalikeComparisonAnnotatedState,
  LookalikeComparisonCharacter,
  LookalikeComparisonGroup,
} from "./types";

function traitKey(s: CharacterStateDTO): string {
  if (s.kind === "categorical") return `cat:${s.trait.canonicalId}`;
  if (s.kind === "number") return `num:${s.siBaseValue}`;
  return `range:${s.siBaseMin}:${s.siBaseMax}`;
}

function overlapsRange(
  s: Extract<CharacterStateDTO, { kind: "range" }>,
  others: Extract<CharacterStateDTO, { kind: "range" }>[],
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

function annotateStates(
  own: CharacterStateDTO[],
  other: CharacterStateDTO[],
): LookalikeComparisonAnnotatedState[] {
  const otherKeys = new Set(other.map(traitKey));
  const otherRanges = other.filter(
    (s): s is Extract<CharacterStateDTO, { kind: "range" }> =>
      s.kind === "range",
  );

  return own.map((s) => {
    if (s.kind === "range") {
      return { ...s, isOverlapping: overlapsRange(s, otherRanges) };
    }
    return { ...s, isOverlapping: otherKeys.has(traitKey(s)) };
  });
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
    const aHasGroup = aGroup !== undefined;
    const bHasGroup = bGroup !== undefined;

    const groupLabel = aGroup?.featureLabel ?? bGroup?.featureLabel ?? "";
    const groupHasInfo =
      aGroup?.featureHasInfo ?? bGroup?.featureHasInfo ?? false;
    const aStates = aGroup?.states ?? null;
    const bStates = bGroup?.states ?? null;

    let aCharacters: LookalikeComparisonCharacter[] | null = null;
    let bCharacters: LookalikeComparisonCharacter[] | null = null;

    if (aStates !== null || bStates !== null) {
      const aByChar = new Map<
        number,
        { states: CharacterStateDTO[]; label: string }
      >();
      const bByChar = new Map<
        number,
        { states: CharacterStateDTO[]; label: string }
      >();

      function collectIntoMap(
        map: typeof aByChar,
        states: CharacterStateDTO[],
      ) {
        for (const s of states) {
          const entry = map.get(s.characterId) ?? {
            states: [],
            label: s.characterLabel,
          };
          entry.states.push(s);
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

        aCharacters.push({
          characterId,
          characterLabel,
          states: annotateStates(aEntry?.states ?? [], bEntry?.states ?? []),
        });

        bCharacters.push({
          characterId,
          characterLabel,
          states: annotateStates(bEntry?.states ?? [], aEntry?.states ?? []),
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
      groupHasInfo,
      aHasGroup,
      bHasGroup,
      aCharacters,
      bCharacters,
    });
  }

  result.sort((a, b) => a.groupLabel.localeCompare(b.groupLabel));
  return result;
}
