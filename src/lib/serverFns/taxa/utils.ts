import { notFound } from "@tanstack/react-router";
import { and, count, eq, sql } from "drizzle-orm";
import { taxonName as namesTbl } from "../../../db/schema/schema";
import { taxon as taxaTbl } from "../../../db/schema/taxa/taxon";
import { Transaction } from "../../utils/transactionType";
import { TaxonRow } from "./types";

export async function assertExactlyOneAcceptedScientificName(
  tx: Transaction,
  taxonId: number
): Promise<void> {
  const [{ cnt }] = await tx
    .select({ cnt: count() })
    .from(namesTbl)
    .where(
      and(
        eq(namesTbl.taxonId, taxonId),
        sql`${namesTbl.locale} = 'sci' AND ${namesTbl.isPreferred} = true`
      )
    );

  const countVal = Number(cnt);
  if (countVal !== 1) {
    throw new Error(
      `Taxon ${taxonId} must have exactly one accepted scientific name, found ${countVal}.`
    );
  }
}

export async function getCurrentTaxonMinimal(
  tx: Transaction,
  id: number
): Promise<Pick<TaxonRow, "id" | "parentId" | "rank" | "status">> {
  const [row] = await tx
    .select({
      id: taxaTbl.id,
      parentId: taxaTbl.parentId,
      rank: taxaTbl.rank,
      status: taxaTbl.status,
    })
    .from(taxaTbl)
    .where(eq(taxaTbl.id, id))
    .limit(1);

  if (!row) throw notFound();
  return row;
}

/** Quick child-count check. */
export async function getChildCount(
  tx: Transaction,
  id: number
): Promise<number> {
  const [{ cnt }] = await tx
    .select({ cnt: count() })
    .from(taxaTbl)
    .where(eq(taxaTbl.parentId, id));
  return Number(cnt);
}
