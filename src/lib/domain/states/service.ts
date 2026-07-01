import { db } from "../../../../db/client";
import type { ValueOf } from "../../utils/types/valueOf";
import { selectTaxonStatesByTaxonIds, type TaxonStatesById } from "./repo";

/**
 * Fetch all character states for a taxon.
 */
export async function getTaxonStates(args: {
  taxonId: number;
}): Promise<ValueOf<TaxonStatesById>> {
  const map = await db.transaction((tx) =>
    selectTaxonStatesByTaxonIds(tx, [args.taxonId]),
  );
  return map[args.taxonId.toString()] ?? [];
}

/**
 * INTERNAL USE ONLY. Do not expose in public API.
 * Fetch character states for many taxa at once.
 * Returns a map taxonId -> FeatureStateDTO[].
 */
export async function getTaxaStates(args: {
  taxonIds: number[];
}): Promise<TaxonStatesById> {
  if (!args.taxonIds.length) return {};

  return db.transaction((tx) => selectTaxonStatesByTaxonIds(tx, args.taxonIds));
}
