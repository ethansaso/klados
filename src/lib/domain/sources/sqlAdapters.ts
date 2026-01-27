import { SQL, sql, type AnyColumn } from "drizzle-orm";
import { db } from "../../../../db/client";
import { taxonSource as taxonSourceTbl } from "../../../../db/schema/schema";
import { source as sourceTbl } from "../../../../db/schema/sources/source";
import type { SourceDTO } from "./types";

export const taxonSourceUsageAgg = db
  .select({
    sourceId: taxonSourceTbl.sourceId,
    usageCount: sql<number>`CAST(COUNT(*) AS INT)`.as("usageCount"),
  })
  .from(taxonSourceTbl)
  .groupBy(taxonSourceTbl.sourceId)
  .as("taxon_source_usage");

type Selectable = AnyColumn | SQL<number>;

/**
 * ! Requires taxonSourceUsageAgg to be joined in query for usageCount to work.
 */
export const sourceSelectDto = {
  id: sourceTbl.id,
  name: sourceTbl.name,
  authors: sourceTbl.authors,
  publisher: sourceTbl.publisher,
  note: sourceTbl.note,
  isbn: sourceTbl.isbn,
  url: sourceTbl.url,
  publicationYear: sourceTbl.publicationYear,
  usageCount: sql<number>`COALESCE(${taxonSourceUsageAgg.usageCount}, 0)`,
} satisfies Record<keyof SourceDTO, Selectable>;
