import { and, asc, count, eq, ilike, inArray, or, type SQL } from "drizzle-orm";
import { db } from "../../../../db/client";
import { media as mediaTbl } from "../../../../db/schema/media/media";
import { taxonMedia as taxonMediaTbl } from "../../../../db/schema/media/taxonMedia";
import { likeAnywhere } from "../../utils/sql/likeAnywhere";
import type { Transaction } from "../../utils/types/transactionType";
import type { InsertMediaArgs, MediaDTO, MediaPaginatedResult } from "./types";

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
 * TODO: above line is a slop gen, refactor to allow passing a transaction or db instance
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

/**
 * List media with optional text search, paginated.
 */
export async function listMediaQuery(args: {
  q?: string;
  page: number;
  pageSize: number;
}): Promise<MediaPaginatedResult> {
  const { q, page, pageSize } = args;
  const offset = (page - 1) * pageSize;

  const like = likeAnywhere(q);

  const filters: (SQL | undefined)[] = [
    like
      ? or(
          ilike(mediaTbl.title, like),
          ilike(mediaTbl.owner, like),
          ilike(mediaTbl.source, like),
        )
      : undefined,
  ];
  const filtered = filters.filter(Boolean) as SQL[];
  const where = filtered.length ? and(...filtered) : undefined;

  const items = await db
    .select()
    .from(mediaTbl)
    .where(where)
    .orderBy(asc(mediaTbl.id))
    .limit(pageSize)
    .offset(offset);

  const [totalRow] = await db
    .select({ total: count() })
    .from(mediaTbl)
    .where(where);
  const total = totalRow?.total ?? 0;

  return { items, page, pageSize, total };
}
