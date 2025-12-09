import {
  and,
  asc,
  count,
  countDistinct,
  eq,
  ilike,
  inArray,
  sql,
  type SQL,
} from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";

import { db } from "../../../db/client";
import { taxonName as namesTbl } from "../../../db/schema/taxa/name";
import { taxon as taxaTbl } from "../../../db/schema/taxa/taxon";
import { Transaction } from "../../utils/transactionType";
import { TaxonSearchParams } from "./search";
import {
  common,
  commonJoinPred,
  sci,
  sciJoinPred,
  taxonSelector,
} from "./sqlAdapters";
import type {
  LeanTaxonDTO,
  TaxonDetailDTO,
  TaxonDTO,
  TaxonPaginatedResult,
  TaxonRow,
} from "./types";
import { computeRankBand } from "./utils";

/**
 * Insert a draft taxon row and return its id.
 */
export async function insertDraftTaxon(
  tx: Transaction,
  args: { parentId: number | null; rank: TaxonRow["rank"] }
): Promise<{ id: number }> {
  const [row] = await tx
    .insert(taxaTbl)
    .values({ parentId: args.parentId, rank: args.rank })
    .returning({ id: taxaTbl.id });

  return row;
}

/**
 * Insert the accepted scientific name for a taxon.
 */
export async function insertAcceptedSciName(
  tx: Transaction,
  args: { taxonId: number; value: string }
): Promise<void> {
  await tx.insert(namesTbl).values({
    value: args.value,
    taxonId: args.taxonId,
    locale: "sci",
    isPreferred: true,
  });
}

/**
 * Select a TaxonDTO by id within a transaction.
 */
export async function selectTaxonDtoById(
  tx: Transaction,
  id: number
): Promise<TaxonDTO | null> {
  const [dto] = await tx
    .select(taxonSelector)
    .from(taxaTbl)
    .innerJoin(sci, sciJoinPred)
    .leftJoin(common, commonJoinPred)
    .where(eq(taxaTbl.id, id))
    .limit(1);

  return dto ?? null;
}

/**
 * Select multiple TaxonDTOs by their IDs within a transaction.
 */
export async function selectTaxonDtosByIds(
  tx: Transaction,
  ids: number[]
): Promise<TaxonDTO[]> {
  const dtos = await tx
    .select(taxonSelector)
    .from(taxaTbl)
    .innerJoin(sci, sciJoinPred)
    .leftJoin(common, commonJoinPred)
    .where(inArray(taxaTbl.id, ids))
    .orderBy(asc(taxaTbl.id));

  return dtos;
}

/**
 * Delete a taxon by id and return the deleted id, or null if nothing was deleted.
 */
export async function deleteTaxonById(
  tx: Transaction,
  id: number
): Promise<{ id: number } | null> {
  const deleted = await tx
    .delete(taxaTbl)
    .where(eq(taxaTbl.id, id))
    .returning({ id: taxaTbl.id });

  return deleted[0] ?? null;
}

/**
 * Update a taxon's status and replacedById, then return its DTO.
 */
export async function updateTaxonStatusAndReplacement(
  tx: Transaction,
  args: { id: number; status: TaxonRow["status"]; replacedById?: number | null }
): Promise<TaxonDTO | null> {
  await tx
    .update(taxaTbl)
    .set({
      status: args.status,
      replacedById: args.replacedById ?? null,
    })
    .where(eq(taxaTbl.id, args.id));

  return selectTaxonDtoById(tx, args.id);
}

/**
 * Fetch a taxon detail view (base + ancestors + names) by id.
 */
export async function fetchTaxonDetailById(
  id: number
): Promise<TaxonDetailDTO | null> {
  // Base taxon row
  const baseRows = await db
    .select(taxonSelector)
    .from(taxaTbl)
    .innerJoin(sci, sciJoinPred)
    .leftJoin(common, commonJoinPred)
    .where(eq(taxaTbl.id, id))
    .limit(1);

  const base = baseRows[0];
  if (!base) {
    return null;
  }

  // Ancestors via one recursive CTE (root -> ... -> immediate parent)
  type AncRow = TaxonDTO & { depth: number };

  const ancRows = await db.execute<AncRow>(sql`
    WITH RECURSIVE chain AS (
      SELECT t.id, t.parent_id, 0 AS depth
      FROM ${taxaTbl} t
      WHERE t.id = ${id}
      UNION ALL
      SELECT p.id, p.parent_id, chain.depth + 1
      FROM ${taxaTbl} p
      JOIN chain ON p.id = chain.parent_id
      WHERE chain.depth < 256
    )
    SELECT 
      a.id,
      a.parent_id AS "parentId",
      a.rank,
      a.source_gbif_id AS "sourceGbifId",
      a.source_inat_id AS "sourceInatId",
      a.status,
      a.media,
      a.notes,
      s.value  AS "acceptedName",
      pc.value AS "preferredCommonName",
      (
        SELECT COUNT(*)::int
        FROM ${taxaTbl} c
        WHERE c.parent_id = a.id AND c.status = 'active'
      ) AS "activeChildCount",
      chain.depth
    FROM chain
    JOIN ${taxaTbl} a ON a.id = chain.id
    JOIN ${namesTbl} s 
      ON s.taxon_id = a.id 
     AND s.locale = 'sci'
     AND s.is_preferred = true
    LEFT JOIN ${namesTbl} pc
      ON pc.taxon_id = a.id
     AND pc.locale = 'en'
     AND pc.is_preferred = true
    WHERE chain.depth >= 1
    ORDER BY chain.depth DESC
  `);

  const ancestors: TaxonDTO[] = ancRows.rows.map((r) => ({
    id: r.id,
    parentId: r.parentId,
    rank: r.rank,
    sourceGbifId: r.sourceGbifId,
    sourceInatId: r.sourceInatId,
    status: r.status,
    media: r.media,
    notes: r.notes,
    acceptedName: r.acceptedName,
    preferredCommonName: r.preferredCommonName,
    activeChildCount: r.activeChildCount,
  }));

  // Fetch all associated names (for the focal taxon)
  const nameRows = await db
    .select({
      id: namesTbl.id,
      value: namesTbl.value,
      locale: namesTbl.locale,
      isPreferred: namesTbl.isPreferred,
    })
    .from(namesTbl)
    .where(eq(namesTbl.taxonId, id))
    .orderBy(asc(namesTbl.locale), asc(namesTbl.value));

  const names = nameRows.map((n) => ({
    id: n.id,
    value: n.value,
    locale: n.locale,
    isPreferred: n.isPreferred,
  }));

  // Fetch direct subtaxa with accepted scientific names
  const childSci = alias(namesTbl, "child_sci");

  const childRows = await db
    .select({
      id: taxaTbl.id,
      rank: taxaTbl.rank,
      acceptedName: childSci.value,
    })
    .from(taxaTbl)
    .innerJoin(
      childSci,
      and(
        eq(childSci.taxonId, taxaTbl.id),
        eq(childSci.locale, "sci"),
        eq(childSci.isPreferred, true)
      )
    )
    .where(and(eq(taxaTbl.parentId, id), eq(taxaTbl.status, "active")))
    .orderBy(asc(taxaTbl.rank), asc(taxaTbl.id));

  const subtaxa: LeanTaxonDTO[] = childRows.map((c) => ({
    id: c.id,
    rank: c.rank,
    acceptedName: c.acceptedName,
  }));

  // Assemble final TaxonDetailDTO
  const { parentId: _omit, ...baseWithoutParent } = base;
  const detail: TaxonDetailDTO = {
    ...baseWithoutParent,
    ancestors,
    names,
    subtaxa,
  };

  return detail;
}

/**
 * List taxa with optional search + filters, paginated.
 */
export async function listTaxaQuery(
  args: TaxonSearchParams
): Promise<TaxonPaginatedResult> {
  const { q, page, pageSize, status, highRank, lowRank, hasMedia } = args;

  const offset = (page - 1) * pageSize;

  // Escape %, _ and \ in the search string (no user wildcards)
  const rawQ = q?.trim();
  const likeAnywhere =
    rawQ && rawQ.length ? `%${rawQ.replace(/([%_\\])/g, "\\$1")}%` : undefined;

  // Aliases for filtering names when searching
  const searchNames = alias(namesTbl, "search_names");

  // Common predicates
  const statusFilter = status
    ? eq(taxaTbl.status, status)
    : eq(taxaTbl.status, "active");

  const allowedRanks = computeRankBand(highRank, lowRank);
  const rankFilter =
    allowedRanks && allowedRanks.length
      ? inArray(taxaTbl.rank, allowedRanks)
      : undefined;

  const hasMediaFilter = hasMedia
    ? sql`jsonb_array_length(${taxaTbl.media}) > 0`
    : undefined;

  // When q is provided, filter on names.value (trigram index)
  if (likeAnywhere) {
    const filters: (SQL | undefined)[] = [
      statusFilter,
      ilike(searchNames.value, likeAnywhere),
      rankFilter,
      hasMediaFilter,
    ];
    const where = and(...(filters.filter(Boolean) as SQL[]));

    const items = await db
      .select(taxonSelector)
      .from(taxaTbl)
      .innerJoin(searchNames, eq(searchNames.taxonId, taxaTbl.id))
      .innerJoin(sci, sciJoinPred)
      .leftJoin(common, commonJoinPred)
      .where(where)
      .groupBy(
        taxaTbl.id,
        taxaTbl.rank,
        taxaTbl.sourceGbifId,
        taxaTbl.sourceInatId,
        taxaTbl.status,
        sci.value,
        common.value
      )
      .orderBy(asc(taxaTbl.rank), asc(taxaTbl.id))
      .limit(pageSize)
      .offset(offset);

    // Total count with same predicate (distinct taxa)
    const [{ total }] = await db
      .select({ total: countDistinct(taxaTbl.id) })
      .from(taxaTbl)
      .innerJoin(searchNames, eq(searchNames.taxonId, taxaTbl.id))
      .where(where);

    return { items, page, pageSize, total };
  }

  // No q: default to active + any other filters; still include accepted scientific + preferred common
  const baseFilters: (SQL | undefined)[] = [
    statusFilter,
    rankFilter,
    hasMediaFilter,
  ];
  const where = and(...(baseFilters.filter(Boolean) as SQL[]));

  const items = await db
    .select(taxonSelector)
    .from(taxaTbl)
    .innerJoin(sci, sciJoinPred)
    .leftJoin(common, commonJoinPred)
    .where(where)
    .orderBy(asc(taxaTbl.rank), asc(taxaTbl.id))
    .limit(pageSize)
    .offset(offset);

  const [{ total }] = await db
    .select({ total: count() })
    .from(taxaTbl)
    .where(where);

  return { items, page, pageSize, total };
}

export async function markTaxonActive(
  tx: Transaction,
  id: number
): Promise<boolean> {
  const updated = await tx
    .update(taxaTbl)
    .set({ status: "active" })
    .where(eq(taxaTbl.id, id))
    .returning({ id: taxaTbl.id });

  return updated.length > 0;
}
