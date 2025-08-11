import { db } from "../client";
import { taxa, names } from "../schema/schema";
import { and, asc, desc, eq, ilike, inArray, or } from "drizzle-orm";

/**
 * Creates a new taxon
 */
export async function createTaxon(input: {
  parentId: number | null;
  rank: typeof taxa.$inferInsert.rank;
  canonical: string;
}) {
  const [row] = await db.insert(taxa).values(input).returning({ id: taxa.id });
  return row.id;
}

/**
 * Fetch taxon with its labels
 */
export async function getTaxon(id: number) {
  const [row] = await db.select().from(taxa).where(eq(taxa.id, id)).limit(1);
  if (!row) return null;

  const common = await db
    .select({ value: names.value, locale: names.locale })
    .from(names)
    .where(and(eq(names.taxonId, id), eq(names.kind, "common")));

  const scientific = await db
    .select({ value: names.value })
    .from(names)
    .where(and(eq(names.taxonId, id), eq(names.kind, "scientific")));

  return {
    ...row,
    commonNames: common, // [{ value, locale }]
    scientificNames: scientific, // [{ value }]
  };
}

/**
 * Search by canonical or any name (common/scientific) without duplicates
 */
export async function searchTaxa(q: string | undefined, limit = 20, offset = 0) {
  const term = q?.trim() ?? "";
  if (!term) {
    return db
      .select({ id: taxa.id, canonical: taxa.canonical, rank: taxa.rank, updatedAt: taxa.updatedAt })
      .from(taxa)
      .orderBy(asc(taxa.canonical), asc(taxa.id))
      .limit(limit)
      .offset(offset);
  }

  const like = `%${term}%`;
  const viaNames = await db
    .selectDistinct({ id: names.taxonId })
    .from(names)
    .where(ilike(names.value, like));

  const ids = viaNames.map((r) => r.id);

  return db
    .select({ id: taxa.id, canonical: taxa.canonical, rank: taxa.rank, updatedAt: taxa.updatedAt })
    .from(taxa)
    .where(ids.length ? or(ilike(taxa.canonical, like), inArray(taxa.id, ids)) : ilike(taxa.canonical, like))
    .orderBy(asc(taxa.canonical), asc(taxa.id))
    .limit(limit)
    .offset(offset);
}

/**
 * Displays most recently updated taxa. Useful for debugging.
 */
export async function latestTaxa(limit = 50) {
  return db
    .select({ id: taxa.id, canonical: taxa.canonical, rank: taxa.rank, updatedAt: taxa.updatedAt })
    .from(taxa)
    .orderBy(desc(taxa.updatedAt))
    .limit(limit);
}
