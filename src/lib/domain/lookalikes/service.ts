import { db } from "../../../db/client";
import { selectTaxonCharacterStatesByTaxonIds } from "../character-states/repo";
import { selectCharactersByIds } from "../characters/repo";
import { selectTaxonDtoById } from "../taxa/repo";
import { computeTaxonLookalikesByCategoricalOverlap } from "./repo";
import { LookalikeComparisonDetailDTO, TaxonLookalikeDTO } from "./types";
import { buildGroupedLookalikeStates } from "./util";

export const getLookalikesForTaxon = async (
  taxonId: number,
  limit: number
): Promise<TaxonLookalikeDTO[]> => {
  const lookalikes = await computeTaxonLookalikesByCategoricalOverlap({
    taxonId,
    limit,
  });
  return lookalikes;
};

export const getLookalikeComparisonDetailForTaxa = async (args: {
  taxonId: number;
  lookalikeId: number;
}): Promise<LookalikeComparisonDetailDTO> => {
  return db.transaction(async (tx) => {
    const byTaxon = await selectTaxonCharacterStatesByTaxonIds(tx, [
      args.taxonId,
      args.lookalikeId,
    ]);

    const [aTaxon, bTaxon] = await Promise.all([
      selectTaxonDtoById(tx, args.taxonId),
      selectTaxonDtoById(tx, args.lookalikeId),
    ]);

    if (!aTaxon) throw new Error(`Taxon with ID ${args.taxonId} not found.`);
    if (!bTaxon)
      throw new Error(`Taxon with ID ${args.lookalikeId} not found.`);

    const aStates = byTaxon[args.taxonId] ?? [];
    const bStates = byTaxon[args.lookalikeId] ?? [];

    // Union of character IDs involved in either taxon.
    const characterIds = Array.from(
      new Set<number>([
        ...aStates.map((s) => s.characterId),
        ...bStates.map((s) => s.characterId),
      ])
    );

    // Pull labels & group labels, already sorted by group.label then char.label.
    const characters = await selectCharactersByIds(tx, characterIds);

    // Optional safety: ensure we didn’t lose any ids (should never happen).
    if (characters.length !== characterIds.length) {
      const got = new Set(characters.map((c) => c.id));
      const missing = characterIds.filter((id) => !got.has(id));
      throw new Error(`Missing character rows for ids: ${missing.join(", ")}`);
    }

    const groupedStates = buildGroupedLookalikeStates({
      aStates,
      bStates,
      characters,
    });

    return {
      a: aTaxon,
      b: bTaxon,
      groupedStates,
    };
  });
};
