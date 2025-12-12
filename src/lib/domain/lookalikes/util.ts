import { TaxonCharacterStateDTO, Trait } from "../character-states/types";
import { LookalikeCompareDTO } from "./types";

function keyTrait(trait: Trait) {
  return String(trait.id);
}

export function diffCategoricalStates(
  a: TaxonCharacterStateDTO[],
  b: TaxonCharacterStateDTO[]
): LookalikeCompareDTO["diff"] {
  const aByChar = new Map(a.map((s) => [s.characterId, s]));
  const bByChar = new Map(b.map((s) => [s.characterId, s]));

  const allCharIds = new Set<number>([
    ...Array.from(aByChar.keys()),
    ...Array.from(bByChar.keys()),
  ]);

  const shared: TaxonCharacterStateDTO[] = [];
  const onlyA: TaxonCharacterStateDTO[] = [];
  const onlyB: TaxonCharacterStateDTO[] = [];

  for (const characterId of allCharIds) {
    const as = aByChar.get(characterId);
    const bs = bByChar.get(characterId);

    if (!as && bs) {
      onlyB.push(bs);
      continue;
    }
    if (as && !bs) {
      onlyA.push(as);
      continue;
    }
    if (!as || !bs) continue;

    const aSet = new Map(as.traitValues.map((tv) => [keyTrait(tv), tv]));
    const bSet = new Map(bs.traitValues.map((tv) => [keyTrait(tv), tv]));

    const sharedTvs: typeof as.traitValues = [];
    const onlyATvs: typeof as.traitValues = [];
    const onlyBTvs: typeof bs.traitValues = [];

    for (const [k, tv] of aSet) {
      if (bSet.has(k)) sharedTvs.push(tv);
      else onlyATvs.push(tv);
    }
    for (const [k, tv] of bSet) {
      if (!aSet.has(k)) onlyBTvs.push(tv);
    }

    if (sharedTvs.length) {
      shared.push({ ...as, traitValues: sharedTvs });
    }
    if (onlyATvs.length) {
      onlyA.push({ ...as, traitValues: onlyATvs });
    }
    if (onlyBTvs.length) {
      onlyB.push({ ...bs, traitValues: onlyBTvs });
    }
  }

  return { shared, onlyA, onlyB };
}
