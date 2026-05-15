import { asc, eq, inArray } from "drizzle-orm";
import { db } from "../../../../db/client";
import { media as mediaTbl } from "../../../../db/schema/media/media";
import { taxonMedia as taxonMediaTbl } from "../../../../db/schema/media/taxonMedia";
import type { Transaction } from "../../utils/transactionType";
import type { InsertMediaArgs, MediaDTO } from "./types";

export async function selectMediaById(
  tx: Transaction,
  id: number,
): Promise<MediaDTO | null> {
  const [row] = await tx
    .select()
    .from(mediaTbl)
    .where(eq(mediaTbl.id, id))
    .limit(1);

  return row ?? null;
}

export async function selectMediaByStorageKey(
  key: string,
): Promise<MediaDTO | null> {
  const [row] = await db
    .select()
    .from(mediaTbl)
    .where(eq(mediaTbl.storageKey, key))
    .limit(1);

  return row ?? null;
}

export async function updateMedia(
  tx: Transaction,
  id: number,
  patch: Partial<
    Pick<MediaDTO, "license" | "owner" | "source" | "contentType">
  >,
): Promise<MediaDTO | null> {
  const [row] = await tx
    .update(mediaTbl)
    .set(patch)
    .where(eq(mediaTbl.id, id))
    .returning();

  return row ?? null;
}

export async function deleteMediaById(
  tx: Transaction,
  id: number,
): Promise<{ id: number } | null> {
  const [row] = await tx
    .delete(mediaTbl)
    .where(eq(mediaTbl.id, id))
    .returning({ id: mediaTbl.id });

  return row ?? null;
}

/**
 * Returns media for each taxon in `taxonIds`, grouped by taxon ID and ordered
 * by position. Uses `db` directly since this is a read and callers typically
 * call it outside a transaction.
 */
export async function selectMediaByTaxonIds(
  taxonIds: number[],
): Promise<Map<number, MediaDTO[]>> {
  if (taxonIds.length === 0) return new Map();

  const rows = await db
    .select({
      taxonId: taxonMediaTbl.taxonId,
      media: mediaTbl,
    })
    .from(taxonMediaTbl)
    .innerJoin(mediaTbl, eq(mediaTbl.id, taxonMediaTbl.mediaId))
    .where(inArray(taxonMediaTbl.taxonId, taxonIds))
    .orderBy(asc(taxonMediaTbl.taxonId), asc(taxonMediaTbl.position));

  const map = new Map<number, MediaDTO[]>();
  for (const row of rows) {
    const list = map.get(row.taxonId) ?? [];
    list.push(row.media);
    map.set(row.taxonId, list);
  }
  return map;
}

export async function selectMediaByContentHashes(
  hashes: string[],
): Promise<Map<string, MediaDTO>> {
  if (hashes.length === 0) return new Map();

  const rows = await db
    .select()
    .from(mediaTbl)
    .where(inArray(mediaTbl.contentHash, hashes));

  const map = new Map<string, MediaDTO>();
  for (const row of rows) {
    if (row.contentHash) map.set(row.contentHash, row);
  }
  return map;
}

export async function bulkInsertMedia(
  tx: Transaction,
  args: InsertMediaArgs[],
): Promise<MediaDTO[]> {
  if (args.length === 0) return [];

  const rows = await tx.insert(mediaTbl).values(args).returning();
  return rows;
}
