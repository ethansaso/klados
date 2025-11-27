import { createServerFn } from "@tanstack/react-start";
import {
  and,
  asc,
  count,
  countDistinct,
  eq,
  ilike,
  inArray,
  SQL,
} from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { z } from "zod";
import { db } from "../../../../db/client";
import { taxonName as namesTbl } from "../../../../db/schema/taxa/name";
import { taxon as taxaTbl } from "../../../../db/schema/taxa/taxon";
import { PaginationSchema } from "../../../validation/pagination";
import {
  common,
  commonJoinPred,
  sci,
  sciJoinPred,
  selectTaxonDTO,
} from "../sqlAdapters";
import { TaxonPaginatedResult } from "../types";

export const listTaxa = createServerFn({ method: "GET" })
  .inputValidator(
    PaginationSchema.extend({
      q: z.string().optional(),
      status: z.enum(["active", "draft", "deprecated"]).optional(),
      ids: z.array(z.number()).optional(),
    })
  )
  .handler(async ({ data }): Promise<TaxonPaginatedResult> => {
    const { q, ids, page, pageSize: pageSize, status } = data;
    const offset = (page - 1) * pageSize;

    // Escape %, _ and \ in the search string (no user wildcards)
    const rawQ = q?.trim();
    const likeAnywhere =
      rawQ && rawQ.length
        ? `%${rawQ.replace(/([%_\\])/g, "\\$1")}%`
        : undefined;

    // Aliases for filtering names when searching
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

    // No q: only list active taxa; still include accepted scientific + preferred common
    const baseFilters: (SQL | undefined)[] = [
      statusFilter,
      ids && ids.length ? inArray(taxaTbl.id, ids) : undefined,
    ];
    const where = and(...(baseFilters.filter(Boolean) as SQL[]));

    const items = await db
      .select(selectTaxonDTO)
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
  });
