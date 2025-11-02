import { notFound } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import {
  and,
  asc,
  count,
  countDistinct,
  eq,
  ilike,
  inArray,
  sql,
  SQL,
} from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { z } from "zod";
import { db } from "../../db/client";
import { names as namesTbl } from "../../db/schema/taxa/names";
import {
  taxa as taxaTbl,
  TAXON_RANKS_DESCENDING,
  TAXON_STATUSES,
} from "../../db/schema/taxa/taxa";
import { requireCuratorMiddleware } from "../auth/serverFnMiddleware";
import { assertHierarchyInvariant } from "../utils/assertHierarchyInvariant";
import { PaginatedResult } from "./returnTypes";

type TaxonRow = typeof taxaTbl.$inferSelect;
type NameRow = typeof namesTbl.$inferSelect;
export type TaxonDTO = Pick<
  TaxonRow,
  | "id"
  | "parentId"
  | "rank"
  | "sourceGbifId"
  | "sourceInatId"
  | "status"
  | "media"
> & {
  acceptedName: string | null;
};

const sci = alias(namesTbl, "sci");
const sciJoinPred = and(
  eq(sci.taxonId, taxaTbl.id),
  sql`${sci.kind} = 'scientific' AND ${sci.synonymKind} IS NULL`
);

// Reusable selection shape for a TaxonDTO
const selectTaxonDTO = {
  id: taxaTbl.id,
  parentId: taxaTbl.parentId,
  rank: taxaTbl.rank,
  sourceGbifId: taxaTbl.sourceGbifId,
  sourceInatId: taxaTbl.sourceInatId,
  status: taxaTbl.status,
  media: taxaTbl.media,
  acceptedName: sci.value,
};

export interface TaxonPageResult extends PaginatedResult {
  items: TaxonDTO[];
}

export const listTaxa = createServerFn({ method: "GET" })
  .inputValidator(
    z.object({
      q: z.string().optional(),
      status: z.enum(["active", "draft", "deprecated"]).optional(),
      ids: z.array(z.number()).optional(),
      page: z.number().int().min(1).default(1),
      pageSize: z.number().int().min(1).max(100).default(20),
    })
  )
  .handler(async ({ data }): Promise<TaxonPageResult> => {
    const { q, ids, page, pageSize, status } = data;
    const offset = (page - 1) * pageSize;

    // Escape %, _ and \ in the search string (no user wildcards)
    const rawQ = q?.trim();
    const likeAnywhere =
      rawQ && rawQ.length
        ? `%${rawQ.replace(/([%_\\])/g, "\\$1")}%`
        : undefined;

    // Aliases: one for filtering (any name), one for the accepted scientific name
    const searchNames = alias(namesTbl, "search_names");

    // Common predicates
    const statusFilter = status
      ? eq(taxaTbl.status, status)
      : eq(taxaTbl.status, "active");

    // When q is provided, filter on names.value (trigram index)
    if (likeAnywhere) {
      const filters: (SQL | undefined)[] = [
        statusFilter,
        ids && ids.length ? inArray(taxaTbl.id, ids) : undefined,
        ilike(searchNames.value, likeAnywhere),
      ];
      const where = and(...(filters.filter(Boolean) as SQL[]));

      const items = await db
        .select(selectTaxonDTO)
        .from(taxaTbl)
        .innerJoin(searchNames, eq(searchNames.taxonId, taxaTbl.id))
        .leftJoin(sci, sciJoinPred)
        .where(where)
        .groupBy(
          taxaTbl.id,
          taxaTbl.rank,
          taxaTbl.sourceGbifId,
          taxaTbl.sourceInatId,
          taxaTbl.status,
          sci.value
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

    // No q: only list active taxa; still include accepted scientific name
    const baseFilters: (SQL | undefined)[] = [
      statusFilter,
      ids && ids.length ? inArray(taxaTbl.id, ids) : undefined,
    ];
    const where = and(...(baseFilters.filter(Boolean) as SQL[]));

    const items = await db
      .select(selectTaxonDTO)
      .from(taxaTbl)
      .leftJoin(sci, sciJoinPred)
      .where(where)
      .orderBy(asc(taxaTbl.rank), asc(taxaTbl.id))
      .limit(pageSize)
      .offset(offset);

    const [{ total }] = await db
      .select({ total: count() })
      .from(taxaTbl)
      .where(where);

    return { items, page, pageSize, total };
  });

export const getTaxon = createServerFn({ method: "GET" })
  .inputValidator(
    z.object({
      id: z.number(),
    })
  )
  .handler(async ({ data }): Promise<TaxonDTO> => {
    const rows = await db
      .select(selectTaxonDTO)
      .from(taxaTbl)
      .leftJoin(sci, sciJoinPred)
      .where(eq(taxaTbl.id, data.id))
      .limit(1);

    const u = rows[0];
    if (!u) throw notFound();
    return u;
  });

export const createTaxon = createServerFn({ method: "POST" })
  .middleware([requireCuratorMiddleware])
  .inputValidator(
    z.object({
      accepted_name: z.string().nonempty(),
      parent_id: z.int().nullable(),
      rank: z.enum(TAXON_RANKS_DESCENDING),
    })
  )
  .handler(async ({ data }): Promise<TaxonDTO> => {
    const { accepted_name: scientific_name, parent_id, rank } = data;

    return await db.transaction(async (tx) => {
      await assertHierarchyInvariant({
        tx,
        nextParentId: parent_id,
        nextRank: rank,
      });
      const [taxon] = await db
        .insert(taxaTbl)
        .values({ parentId: parent_id, rank })
        .returning();
      const [name] = await db
        .insert(namesTbl)
        .values({
          value: scientific_name,
          taxonId: taxon.id,
          kind: "scientific",
        })
        .returning({ value: namesTbl.value });

      return {
        id: taxon.id,
        parentId: taxon.parentId,
        rank: taxon.rank,
        sourceGbifId: taxon.sourceGbifId,
        sourceInatId: taxon.sourceInatId,
        status: taxon.status,
        media: taxon.media,
        acceptedName: name.value,
      };
    });
  });

// TODO: should we even allow deleting taxa?
// TODO: should be separate endpoints for publish/unpublish/deprecate?
// TODO: maybe don't require all fields, and if so, how to properly set?
// TODO: names -- join?
export const updateTaxon = createServerFn({ method: "POST" })
  .middleware([requireCuratorMiddleware])
  .inputValidator(
    z.object({
      id: z.number(),
      parent_id: z.int().nullable(),
      rank: z.enum(TAXON_RANKS_DESCENDING),
      status: z.enum(TAXON_STATUSES),
    })
  )
  .handler(async ({ data }): Promise<TaxonDTO> => {
    const { id, parent_id, rank, status } = data;

    return await db.transaction(async (tx) => {
      // Ensure the target exists, and prevent self-parenting
      const [current] = await tx
        .select({ id: taxaTbl.id })
        .from(taxaTbl)
        .where(eq(taxaTbl.id, id))
        .limit(1);
      if (!current) throw notFound();
      if (parent_id === id)
        throw new Error("A taxon cannot be its own parent.");

      await assertHierarchyInvariant({
        tx,
        nextParentId: parent_id,
        nextRank: rank,
      });

      const updated = await tx
        .update(taxaTbl)
        .set({ parentId: parent_id, rank, status })
        .where(eq(taxaTbl.id, id))
        .returning({ id: taxaTbl.id });

      if (updated.length === 0) throw notFound();

      const [dto] = await tx
        .select(selectTaxonDTO)
        .from(taxaTbl)
        .leftJoin(sci, sciJoinPred)
        .where(eq(taxaTbl.id, updated[0].id))
        .limit(1);

      if (!dto) throw notFound();
      return dto;
    });
  });
