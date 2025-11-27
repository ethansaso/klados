import { db } from "../../../db/client";
import { selectTaxonCharacterStatesByTaxonId } from "./repo";
import { TaxonCharacterStateDTO } from "./types";

/**
 * Fetch all categorical character states for a taxon.
 */
export async function getTaxonCharacterStates(args: {
  taxonId: number;
}): Promise<TaxonCharacterStateDTO[]> {
  const { taxonId } = args;

  return db.transaction(async (tx) => {
    return selectTaxonCharacterStatesByTaxonId(tx, taxonId);
  });
}
