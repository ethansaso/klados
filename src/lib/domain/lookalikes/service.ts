import { db } from "../../../db/client";
import { selectTaxonCharacterStatesByTaxonIds } from "../character-states/repo";
import { computeTaxonLookalikesByCategoricalOverlap } from "./repo";
import { TaxonLookalikeDTO } from "./types";
import { diffCategoricalStates } from "./util";

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

export const getLookalikeDetailsForTaxa = async (args: {
  taxonId: number;
  lookalikeId: number;
}) => {
  return db.transaction(async (tx) => {
    const byTaxon = await selectTaxonCharacterStatesByTaxonIds(tx, [
      args.taxonId,
      args.lookalikeId,
    ]);

    const aStates = byTaxon[args.taxonId] ?? [];
    const bStates = byTaxon[args.lookalikeId] ?? [];

    return {
      a: { taxonId: args.taxonId, states: aStates },
      b: { taxonId: args.lookalikeId, states: bStates },
      diff: diffCategoricalStates(aStates, bStates),
    };
  });
};
