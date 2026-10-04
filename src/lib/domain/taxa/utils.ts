import { and, count, eq, isNull, ne, sql } from "drizzle-orm";
import { taxonName as namesTbl } from "../../../../db/schema/schema";
import {
  taxon as taxaTbl,
  TAXON_RANKS_DESCENDING,
  type TaxonRank,
} from "../../../../db/schema/taxa/taxon";
import type { Transaction } from "../../utils/types/transactionType";
import type { TaxonFilterToken } from "./search";
import { sci, sciJoinPred } from "./sqlAdapters";
import type { TaxonRow } from "./types";

const SIBLING_NAMES_LOCK_NS = 1006;

/** Precomputed rank: index map to avoid repeated indexOf calls. */
const RANK_INDEX: Record<TaxonRank, number> = TAXON_RANKS_DESCENDING.reduce(
  (acc, rank, idx) => {
    acc[rank] = idx;
    return acc;
  },
  {} as Record<TaxonRank, number>,
);

export async function assertExactlyOneAcceptedScientificName(
  tx: Transaction,
  taxonId: number,
): Promise<void> {
  const counts = await tx
    .select({ cnt: count() })
    .from(namesTbl)
    .where(
      and(
        eq(namesTbl.taxonId, taxonId),
        eq(namesTbl.locale, "sci"),
        eq(namesTbl.isPreferred, true),
      ),
    );
  const cnt = counts[0]?.cnt ?? 0;

  const countVal = Number(cnt);
  if (countVal !== 1) {
    throw new Error(
      `Taxon ${taxonId} must have exactly one accepted scientific name, found ${countVal}.`,
    );
  }
}

/**
 * Accepted scientific names must be unique (case-insensitive, trimmed) among
 * non-archived siblings. Parentless taxa count as siblings of each other.
 */
export async function assertAcceptedNameUniqueAmongSiblings(
  tx: Transaction,
  taxonId: number,
): Promise<void> {
  const [self] = await tx
    .select({ parentId: taxaTbl.parentId, acceptedName: sci.value })
    .from(taxaTbl)
    .innerJoin(sci, sciJoinPred)
    .where(eq(taxaTbl.id, taxonId))
    .limit(1);

  if (!self) return;

  // Lock for race condition
  await tx.execute(
    sql`SELECT pg_advisory_xact_lock(${SIBLING_NAMES_LOCK_NS}, ${self.parentId ?? 0})`,
  );

  const [duplicate] = await tx
    .select({ id: taxaTbl.id, acceptedName: sci.value })
    .from(taxaTbl)
    .innerJoin(sci, sciJoinPred)
    .where(
      and(
        self.parentId === null
          ? isNull(taxaTbl.parentId)
          : eq(taxaTbl.parentId, self.parentId),
        ne(taxaTbl.id, taxonId),
        ne(taxaTbl.status, "archived"),
        sql`lower(btrim(${sci.value})) = lower(btrim(${self.acceptedName}))`,
      ),
    )
    .limit(1);

  if (duplicate) {
    const where =
      self.parentId === null ? "at the top level" : "under this parent";
    throw new Error(
      `"${duplicate.acceptedName}" (taxon ${duplicate.id}) already exists ${where}.`,
    );
  }
}

export async function getCurrentTaxonMinimal(
  tx: Transaction,
  id: number,
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
  id: number,
): Promise<number> {
  const counts = await tx
    .select({ cnt: count() })
    .from(taxaTbl)
    .where(eq(taxaTbl.parentId, id))
    .limit(1);
  return Number(counts[0]?.cnt ?? 0);
}

/**
 * Compute the inclusive band of ranks allowed between highRank and lowRank.
 * If either is omitted, just default to top/bottom of the rank list.
 */
export function computeRankBand(
  highRank?: TaxonRank,
  lowRank?: TaxonRank,
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

/**
 * Identity of a token, for deduping and for matching resolved chip labels back
 * to their token. Shared so the client and server can't disagree on the key.
 */
export function filterTokenKey(token: TaxonFilterToken) {
  switch (token.k) {
    case "f":
      return `f:${token.f}`;
    case "c":
      return `c:${token.f ?? "*"}:${token.c}:${token.t}`;
    case "n":
      return `n:${token.f}:${token.c}:${token.u ?? "*"}:${token.v}`;
  }
}
