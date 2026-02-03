import { db } from "../../../../db/client";
import { selectTaxonCharacterStatesByTaxonIds } from "../states/repo";
import { selectTaxonDtoById } from "../taxa/repo";
import { computeTaxonLookalikesByCategoricalOverlap } from "./repo";
import type { LookalikeComparisonDetailDTO, TaxonLookalikeDTO } from "./types";
import { buildGroupedLookalikeStates } from "./util";

export const getLookalikesForTaxon = async (
  taxonId: number,
  limit: number,
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

    // No need to fetch characters separately - metadata is already on the states!
    const groupedStates = buildGroupedLookalikeStates({
      aStates,
      bStates,
    });

    return {
      a: aTaxon,
      b: bTaxon,
      groupedStates,
    };
  });
};
