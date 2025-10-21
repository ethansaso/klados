import { notFound } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { asc, count, inArray, SQL } from "drizzle-orm";
import { z } from "zod";
import { db } from "../../db/client";
import { taxa as taxaTbl } from "../../db/schema/taxa/taxa";
import { PaginatedResult } from "./returnTypes";

type TaxonRow = typeof taxaTbl.$inferSelect;
export type TaxonDTO = Pick<
  TaxonRow,
  "id" | "rank" | "sourceGbifId" | "sourceInatId"
>;

export interface TaxonPageResult extends PaginatedResult {
  items: TaxonDTO[];
}

export const listTaxa = createServerFn({ method: "GET" })
  .inputValidator(
    z.object({
      q: z.string().optional(),
      ids: z.array(z.number()).optional(),
      page: z.number().int().min(1).default(1),
      pageSize: z.number().int().min(1).max(100).default(20),
    })
  )
  .handler(async ({ data }): Promise<TaxonPageResult> => {
    const { ids, page, pageSize } = data;
    const offset = (page - 1) * pageSize;

    const predicate: SQL | undefined =
      ids && ids.length ? inArray(taxaTbl.id, ids) : undefined;

    const items = await db
      .select({
        id: taxaTbl.id,
        rank: taxaTbl.rank,
        sourceGbifId: taxaTbl.sourceGbifId,
        sourceInatId: taxaTbl.sourceInatId,
      })
      .from(taxaTbl)
      .where(predicate)
      .orderBy(asc(taxaTbl.rank))
      .limit(pageSize)
      .offset(offset);

    // Total count with the same predicate
    const [{ total }] = await db
      .select({ total: count() })
      .from(taxaTbl)
      .where(predicate);

    return {
      items,
      page,
      pageSize,
      total,
    };
  });

export const getTaxon = createServerFn({
  method: "GET",
})
  .inputValidator(
    z.object({
      id: z.number(),
    })
  )
  .handler(async ({ data }): Promise<TaxonDTO> => {
    const { id } = data;

    const u = await db.query.taxa.findFirst({
      where: (t, { eq }) => eq(t.id, id),
      columns: {
        id: true,
        rank: true,
        sourceGbifId: true,
        sourceInatId: true,
      },
    });

    if (!u) {
      throw notFound();
    }
    return u;
  });
