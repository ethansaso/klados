import { db } from "../../../db/client";
import {
  selectTaxonCharacterStatesByTaxonIds,
  TaxonCharacterStatesByTaxonId,
} from "./repo";
import { TaxonCharacterStateDTO } from "./types";

/**
 * Fetch all categorical character states for a taxon.
 */
export async function getTaxonCharacterStates(args: {
  taxonId: number;
}): Promise<TaxonCharacterStateDTO[]> {
  const { taxonId } = args;

  const map = await db.transaction((tx) =>
    selectTaxonCharacterStatesByTaxonIds(tx, [taxonId])
  );

  return map[taxonId] ?? [];
}

/**
 * INTERNAL USE ONLY. Do not expose in public API.
 * Fetch categorical character states for many taxa at once.
 * Returns a map taxonId -> TaxonCharacterStateDTO[].
 */
export async function getTaxaCharacterStates(args: {
  taxonIds: number[];
}): Promise<TaxonCharacterStatesByTaxonId> {
  const { taxonIds } = args;

  if (!taxonIds.length) {
    return {};
  }

  return db.transaction(async (tx) => {
    return selectTaxonCharacterStatesByTaxonIds(tx, taxonIds);
  });
}
