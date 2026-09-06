import { eq } from "drizzle-orm";
import {
  taxon as taxaTbl,
  taxonDistributionTile as tilesTbl,
} from "../../../../db/schema/schema";
import type { TxOrDb } from "../../utils/types/transactionType";
import type { DistributionTileRow } from "./types";

export async function selectDistributionTile(
  tx: TxOrDb,
  taxonId: number,
): Promise<DistributionTileRow | null> {
  const [row] = await tx
    .select()
    .from(tilesTbl)
    .where(eq(tilesTbl.taxonId, taxonId))
    .limit(1);

  return row ?? null;
}

/** Returns a taxon's GBIF ID (or null if unlinked). */
export async function selectTaxonGbifId(
  tx: TxOrDb,
  taxonId: number,
): Promise<number | null> {
  const [row] = await tx
    .select({ sourceGbifId: taxaTbl.sourceGbifId })
    .from(taxaTbl)
    .where(eq(taxaTbl.id, taxonId))
    .limit(1);

  return row?.sourceGbifId ?? null;
}

export async function upsertDistributionTile(
  tx: TxOrDb,
  args: {
    taxonId: number;
    gbifId: number;
    status: DistributionTileRow["status"];
  },
): Promise<void> {
  const generatedAt = new Date();

  await tx
    .insert(tilesTbl)
    .values({ ...args, generatedAt })
    .onConflictDoUpdate({
      target: tilesTbl.taxonId,
      set: { gbifId: args.gbifId, status: args.status, generatedAt },
    });
}
