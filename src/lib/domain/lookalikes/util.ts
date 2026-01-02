import { TaxonCharacterStateDTO } from "../character-states/types";
import { CharacterDTO } from "../characters/types";
import {
  LookalikeComparisonAnnotatedStateGroup,
  LookalikeComparisonAnnotatedTrait,
} from "./types";

function traitKey(tv: { canonicalId: number }) {
  return String(tv.canonicalId);
}

export function buildGroupedLookalikeStates(args: {
  aStates: TaxonCharacterStateDTO[];
  bStates: TaxonCharacterStateDTO[];
  characters: CharacterDTO[]; // sorted by group label, character label, id
}): LookalikeComparisonAnnotatedStateGroup[] {
  const { aStates, bStates, characters } = args;

  const aByChar = new Map(aStates.map((s) => [s.characterId, s]));
  const bByChar = new Map(bStates.map((s) => [s.characterId, s]));

  // Preserve insertion order (which follows `characters` ordering).
  const groups = new Map<number, LookalikeComparisonAnnotatedStateGroup>();

  for (const ch of characters) {
    const characterId = ch.id;

    const aState = aByChar.get(characterId);
    const bState = bByChar.get(characterId);

    const aVals = aState?.traitValues ?? [];
    const bVals = bState?.traitValues ?? [];

    const aSet = new Set(aVals.map(traitKey));
    const bSet = new Set(bVals.map(traitKey));

    const aTraits: LookalikeComparisonAnnotatedTrait[] = aVals.map((tv) => ({
      ...tv,
      isShared: bSet.has(traitKey(tv)),
    }));

    const bTraits: LookalikeComparisonAnnotatedTrait[] = bVals.map((tv) => ({
      ...tv,
      isShared: aSet.has(traitKey(tv)),
    }));

    const groupId = ch.group.id;
    const groupLabel = ch.group.label;

    let group = groups.get(groupId);
    if (!group) {
      group = {
        groupId,
        groupLabel,
        aCharacters: [],
        bCharacters: [],
      };
      groups.set(groupId, group);
    }

    group.aCharacters.push({
      characterId,
      characterLabel: ch.label,
      traits: aTraits,
    });

    group.bCharacters.push({
      characterId,
      characterLabel: ch.label,
      traits: bTraits,
    });
  }

  return Array.from(groups.values());
}
