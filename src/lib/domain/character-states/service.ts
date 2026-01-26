import { db } from "../../../../db/client";
import {
  selectTaxonCharacterStatesByTaxonIds,
  type TaxonCharacterStatesByTaxonId,
} from "./repo";
import type { TaxonCharacterStateDTO } from "./types";

/**
 * Fetch all character states for a taxon.
 */
export async function getTaxonCharacterStates(args: {
  taxonId: number;
}): Promise<TaxonCharacterStateDTO[]> {
  const map = await db.transaction((tx) =>
    selectTaxonCharacterStatesByTaxonIds(tx, [args.taxonId]),
  );
  return map[args.taxonId] ?? [];
}

/**
 * INTERNAL USE ONLY. Do not expose in public API.
 * Fetch character states for many taxa at once.
 * Returns a map taxonId -> TaxonCharacterStateDTO[].
 */
export async function getTaxaCharacterStates(args: {
  taxonIds: number[];
}): Promise<TaxonCharacterStatesByTaxonId> {
  if (!args.taxonIds.length) return {};

  return db.transaction((tx) =>
    selectTaxonCharacterStatesByTaxonIds(tx, args.taxonIds),
  );
}
