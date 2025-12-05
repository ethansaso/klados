import { and, count, eq } from "drizzle-orm";
import { taxonName as namesTbl } from "../../../db/schema/schema";
import {
  taxon as taxaTbl,
  TAXON_RANKS_DESCENDING,
  TaxonRank,
} from "../../../db/schema/taxa/taxon";
import { Transaction } from "../../utils/transactionType";
import { TaxonRow } from "./types";

/** Precomputed rank: index map to avoid repeated indexOf calls. */
const RANK_INDEX: Record<TaxonRank, number> = TAXON_RANKS_DESCENDING.reduce(
  (acc, rank, idx) => {
    acc[rank] = idx;
    return acc;
  },
  {} as Record<TaxonRank, number>
);

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
        eq(namesTbl.locale, "sci"),
        eq(namesTbl.isPreferred, true)
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
): Promise<Pick<TaxonRow, "id" | "parentId" | "rank" | "status"> | null> {
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

  return row ?? null;
}

/** Quick child-count check. */
export async function getChildCount(
  tx: Transaction,
  id: number
): Promise<number> {
  const [{ cnt }] = await tx
    .select({ cnt: count() })
    .from(taxaTbl)
    .where(eq(taxaTbl.parentId, id))
    .limit(1);
  return Number(cnt);
}

/**
 * Compute the inclusive band of ranks allowed between highRank and lowRank.
 * If either is omitted, just default to top/bottom of the rank list.
 */
export function computeRankBand(
  highRank?: TaxonRank,
  lowRank?: TaxonRank
): TaxonRank[] | undefined {
  if (!highRank && !lowRank) return undefined;

  const maxIndex = TAXON_RANKS_DESCENDING.length - 1;
  const highIdx = highRank ? RANK_INDEX[highRank] : 0;
  const lowIdx = lowRank ? RANK_INDEX[lowRank] : maxIndex;

  if (
    highIdx === undefined ||
    Number.isNaN(highIdx) ||
    lowIdx === undefined ||
    Number.isNaN(lowIdx)
  ) {
    return undefined;
  }

  const start = Math.min(highIdx, lowIdx);
  const end = Math.max(highIdx, lowIdx);

  return TAXON_RANKS_DESCENDING.slice(start, end + 1);
}
