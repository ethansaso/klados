import { and, asc, count, desc, eq, ilike, or, SQL } from "drizzle-orm";
import { db } from "../../../../db/client";
import { source as sourceTbl } from "../../../../db/schema/sources/source";
import { likeAnywhere } from "../../utils/likeAnywhere";
import type { Transaction } from "../../utils/transactionType";
import type { SourceSearchParams } from "./search";
import { sourceSelectDto, taxonSourceUsageAgg } from "./sqlAdapters";
import type { SourceDTO, SourcePaginatedResult } from "./types";
import type { SourceItem } from "./validation";

export async function insertSource(
  tx: Transaction,
  source: SourceItem,
): Promise<SourceDTO> {
  const [inserted] = await tx
    .insert(sourceTbl)
    .values({
      name: source.name,
      authors: source.authors,
      publisher: source.publisher,
      note: source.note,
      isbn: source.isbn,
      url: source.url,
      publicationYear: source.publicationYear,
    })
    .returning({
      id: sourceTbl.id,
      name: sourceTbl.name,
      authors: sourceTbl.authors,
      publisher: sourceTbl.publisher,
      note: sourceTbl.note,
      isbn: sourceTbl.isbn,
      url: sourceTbl.url,
      publicationYear: sourceTbl.publicationYear,
    });

  if (!inserted) {
    throw new Error("Failed to insert source.");
  }

  return { ...inserted, usageCount: 0 };
}

export async function selectSourceById(
  tx: Transaction,
  id: number,
): Promise<SourceDTO | null> {
  const [source] = await tx
    .select(sourceSelectDto)
    .from(sourceTbl)
    .leftJoin(
      taxonSourceUsageAgg,
      eq(taxonSourceUsageAgg.sourceId, sourceTbl.id),
    )
    .where(eq(sourceTbl.id, id))
    .limit(1);

  return source ?? null;
}

/**
 * Select a source by unique keys (ISBN or URL).
 * Intended mainly as a helper for deduplication checks.
 */
export async function selectSourceByUniqueKeys(
  tx: Transaction,
  keys: { isbn?: string | null; url?: string | null },
): Promise<SourceDTO | null> {
  const preds: SQL[] = [];

  if (keys.isbn) preds.push(eq(sourceTbl.isbn, keys.isbn));
  if (keys.url) preds.push(eq(sourceTbl.url, keys.url));

  if (!preds.length) return null;

  const [row] = await tx
    .select(sourceSelectDto)
    .from(sourceTbl)
    .leftJoin(
      taxonSourceUsageAgg,
      eq(taxonSourceUsageAgg.sourceId, sourceTbl.id),
    )
    .where(or(...preds))
    .limit(1);

  return row ?? null;
}

export async function deleteSourceById(
  tx: Transaction,
  id: number,
): Promise<{ id: number } | null> {
  const [deleted] = await tx
    .delete(sourceTbl)
    .where(eq(sourceTbl.id, id))
    .returning({ id: sourceTbl.id });

  return deleted ?? null;
}

/**
 * List sources with optional search, paginated.
 */
export async function listSourcesQuery(
  args: SourceSearchParams,
): Promise<SourcePaginatedResult> {
  const { q, page, pageSize } = args;
  const offset = (page - 1) * pageSize;

  const like = likeAnywhere(q);

  const filters: (SQL | undefined)[] = [];

  if (like) {
    filters.push(
      or(
        ilike(sourceTbl.name, like),
        ilike(sourceTbl.authors, like),
        ilike(sourceTbl.publisher, like),
      ),
    );
  }

  const where = filters.length
    ? and(...(filters.filter(Boolean) as SQL[]))
    : undefined;

  // Ordering
  const orderBy = args.orderBy ?? "name";
  const orderDir = args.orderDir ?? "asc";

  const orderExpr =
    orderBy === "publicationYear"
      ? sourceTbl.publicationYear
      : orderBy === "createdAt"
        ? sourceTbl.createdAt
        : sourceTbl.name;

  const order = orderDir === "desc" ? desc(orderExpr) : asc(orderExpr);

  const items = await db
    .select(sourceSelectDto)
    .from(sourceTbl)
    .leftJoin(
      taxonSourceUsageAgg,
      eq(taxonSourceUsageAgg.sourceId, sourceTbl.id),
    )
    .where(where)
    .orderBy(order, asc(sourceTbl.id))
    .limit(pageSize)
    .offset(offset);

  const totals = await db
    .select({ total: count() })
    .from(sourceTbl)
    .where(where);
  const total = totals[0]?.total ?? 0;

  return { items, page, pageSize, total: Number(total) };
}
