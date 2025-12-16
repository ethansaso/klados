import { and, asc, eq, notInArray, sql } from "drizzle-orm";
import { source as sourceTbl } from "../../../db/schema/sources/source";
import { taxonSource as taxonSourceTbl } from "../../../db/schema/sources/taxonSource";
import { Transaction } from "../../utils/transactionType";
import { TaxonSourceDTO } from "./types";
import { TaxonSourceUpsertItem } from "./validation";

export const selectSourcesForTaxon = async (
  tx: Transaction,
  taxonId: number
): Promise<TaxonSourceDTO[]> => {
  const rows = await tx
    .select({
      id: taxonSourceTbl.id,
      taxonId: taxonSourceTbl.taxonId,
      sourceId: taxonSourceTbl.sourceId,
      accessedAt: taxonSourceTbl.accessedAt,
      locator: taxonSourceTbl.locator,
      note: taxonSourceTbl.note,
      source: {
        id: sourceTbl.id,
        name: sourceTbl.name,
        authors: sourceTbl.authors,
        publisher: sourceTbl.publisher,
        note: sourceTbl.note,
        isbn: sourceTbl.isbn,
        url: sourceTbl.url,
        publicationYear: sourceTbl.publicationYear,
      },
    })
    .from(taxonSourceTbl)
    .innerJoin(sourceTbl, eq(sourceTbl.id, taxonSourceTbl.sourceId))
    .where(eq(taxonSourceTbl.taxonId, taxonId))
    .orderBy(asc(sourceTbl.name), asc(taxonSourceTbl.id));

  return rows;
};

/**
 * Removes deleted links, inserts new links, updates existing link metadata.
 */
export async function setSourcesForTaxon(
  tx: Transaction,
  taxonId: number,
  items: TaxonSourceUpsertItem[]
): Promise<void> {
  // Delete all if no links
  if (items.length === 0) {
    await tx.delete(taxonSourceTbl).where(eq(taxonSourceTbl.taxonId, taxonId));
    return;
  }

  const nextSourceIds = items.map((i) => i.sourceId);

  // Delete removed links (those not present in nextSourceIds)
  await tx
    .delete(taxonSourceTbl)
    .where(
      and(
        eq(taxonSourceTbl.taxonId, taxonId),
        notInArray(taxonSourceTbl.sourceId, nextSourceIds)
      )
    );

  // Upsert everything else (insert new + update existing metadata)
  await tx
    .insert(taxonSourceTbl)
    .values(
      items.map((i) => ({
        taxonId,
        sourceId: i.sourceId,
        accessedAt: i.accessedAt,
        locator: i.locator,
        note: i.note,
      }))
    )
    .onConflictDoUpdate({
      target: [taxonSourceTbl.taxonId, taxonSourceTbl.sourceId],
      set: {
        // Must use sql`excluded.xxx` to refer to the new value;
        // just using i.accessedAt etc. will close over the last value in the loop
        accessedAt: sql`excluded.accessed_at`,
        locator: sql`excluded.locator`,
        note: sql`excluded.note`,
      },
    });
}
