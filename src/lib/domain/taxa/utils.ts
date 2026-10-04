import { and, count, eq, isNull, ne, sql } from "drizzle-orm";
import { taxonName as namesTbl } from "../../../../db/schema/schema";
import {
  taxon as taxaTbl,
  TAXON_RANKS_DESCENDING,
  type TaxonRank,
} from "../../../../db/schema/taxa/taxon";
import type { Transaction } from "../../utils/types/transactionType";
import {
  RANK_NAME_SHAPE,
  sciNameWords,
  validateScientificName,
} from "../taxon-names/scientificName";
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

/**
 * Accepted scientific name must match rank's naming convention. For ancestry:
 *  - complex/species: first word is the nearest genus ancestor's name.
 *  - infraspecific: all but the last word is the nearest species ancestor's name,
 *    else the first word is the nearest genus ancestor's name.
 * Missing ancestors (e.g. incertae sedis placements) skip the check.
 */
export async function assertAcceptedNameConvention(
  tx: Transaction,
  taxonId: number,
): Promise<void> {
  const [self] = await tx
    .select({
      parentId: taxaTbl.parentId,
      rank: taxaTbl.rank,
      acceptedName: sci.value,
    })
    .from(taxaTbl)
    .innerJoin(sci, sciJoinPred)
    .where(eq(taxaTbl.id, taxonId))
    .limit(1);

  if (!self) return;

  const shapeError = validateScientificName(self.acceptedName, self.rank);
  if (shapeError) throw new Error(shapeError);

  const shape = RANK_NAME_SHAPE[self.rank];
  if (shape === "uninomial" || self.parentId === null) return;

  const ancestors = await tx.execute<{ rank: TaxonRank; acceptedName: string }>(sql`
    WITH RECURSIVE chain AS (
      SELECT t.id, t.parent_id, t.rank, 1 AS depth
      FROM ${taxaTbl} t
      WHERE t.id = ${self.parentId}
      UNION ALL
      SELECT p.id, p.parent_id, p.rank, chain.depth + 1
      FROM ${taxaTbl} p
      JOIN chain ON p.id = chain.parent_id
      WHERE chain.depth < 256
    )
    SELECT chain.rank, n.value AS "acceptedName"
    FROM chain
    JOIN ${namesTbl} n
      ON n.taxon_id = chain.id
     AND n.locale = 'sci'
     AND n.is_preferred = true
    WHERE chain.rank IN ('genus', 'species')
    ORDER BY chain.depth
  `);

  const nearest = (rank: TaxonRank) =>
    ancestors.rows.find((a) => a.rank === rank)?.acceptedName;
  const genus = nearest("genus");
  const species = shape === "trinomial" ? nearest("species") : undefined;

  const words = sciNameWords(self.acceptedName).map((w) => w.toLowerCase());
  const startsWith = (prefix: string) => {
    const prefixWords = sciNameWords(prefix).map((w) => w.toLowerCase());
    return prefixWords.every((w, i) => words[i] === w);
  };

  if (species !== undefined) {
    if (!startsWith(species) || words.length !== sciNameWords(species).length + 1) {
      throw new Error(
        `"${self.acceptedName}" must be its species "${species}" plus one epithet.`,
      );
    }
  } else if (genus !== undefined && !startsWith(genus)) {
    throw new Error(
      `"${self.acceptedName}" must begin with its genus "${genus}".`,
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
