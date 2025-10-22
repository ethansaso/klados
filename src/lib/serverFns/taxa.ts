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
import { taxa as taxaTbl } from "../../db/schema/taxa/taxa";
import { PaginatedResult } from "./returnTypes";

type TaxonRow = typeof taxaTbl.$inferSelect;
export type TaxonDTO = Pick<
  TaxonRow,
  "id" | "rank" | "sourceGbifId" | "sourceInatId" | "status"
> & {
  scientificName: string | null;
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
    const { ids, page, pageSize, status } = data;
    const offset = (page - 1) * pageSize;

    // Escape %, _ and \ in the search string (no user wildcards)
    const rawQ = data.q?.trim();
    const likeAnywhere =
      rawQ && rawQ.length
        ? `%${rawQ.replace(/([%_\\])/g, "\\$1")}%`
        : undefined;

    // Aliases: one for filtering (any name), one for the accepted scientific name
    const searchNames = alias(namesTbl, "search_names");
    const sci = alias(namesTbl, "sci");

    // Common predicates
    const statusFilter = data.status
      ? eq(taxaTbl.status, data.status)
      : eq(taxaTbl.status, "active");
    const sciJoinPred = and(
      eq(sci.taxonId, taxaTbl.id),
      sql`${sci.kind} = 'scientific' AND ${sci.synonymKind} IS NULL`
    );

    // When q is provided, filter on names.value (trigram index)
    if (likeAnywhere) {
      const filters: (SQL | undefined)[] = [
        statusFilter,
        ids && ids.length ? inArray(taxaTbl.id, ids) : undefined,
        ilike(searchNames.value, likeAnywhere),
      ];
      const where = and(...(filters.filter(Boolean) as SQL[]));

      const items = await db
        .select({
          id: taxaTbl.id,
          rank: taxaTbl.rank,
          sourceGbifId: taxaTbl.sourceGbifId,
          sourceInatId: taxaTbl.sourceInatId,
          status: taxaTbl.status,
          scientificName: sci.value,
        })
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
      .select({
        id: taxaTbl.id,
        rank: taxaTbl.rank,
        sourceGbifId: taxaTbl.sourceGbifId,
        sourceInatId: taxaTbl.sourceInatId,
        status: taxaTbl.status,
        scientificName: sci.value,
      })
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
    const sci = alias(namesTbl, "sci");

    const rows = await db
      .select({
        id: taxaTbl.id,
        rank: taxaTbl.rank,
        sourceGbifId: taxaTbl.sourceGbifId,
        sourceInatId: taxaTbl.sourceInatId,
        status: taxaTbl.status,
        scientificName: sci.value,
      })
      .from(taxaTbl)
      .leftJoin(
        sci,
        and(
          eq(sci.taxonId, taxaTbl.id),
          sql`${sci.kind} = 'scientific' AND ${sci.synonymKind} IS NULL`
        )
      )
      .where(eq(taxaTbl.id, data.id))
      .limit(1);

    const u = rows[0];
    if (!u) throw notFound();
    return u;
  });
