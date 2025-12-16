import { db } from "../../../db/client";
import { selectSourcesForTaxon } from "./repo";
import { TaxonSourceDTO } from "./types";

/**
 * Get all sources for a taxon.
 */
export async function getSourcesForTaxon(args: {
  id: number;
}): Promise<TaxonSourceDTO[] | null> {
  return db.transaction(async (tx) => {
    const src = await selectSourcesForTaxon(tx, args.id);
    return src;
  });
}
