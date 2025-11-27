import { notFound } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { and, count, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "../../../../db/client";
import { taxon as taxaTbl } from "../../../../db/schema/taxa/taxon";
import { requireCuratorMiddleware } from "../../../auth/serverFnMiddleware";
import {
  common,
  commonJoinPred,
  sci,
  sciJoinPred,
  selectTaxonDTO,
} from "../sqlAdapters";
import { TaxonDTO } from "../types";
import { getCurrentTaxonMinimal } from "../utils";

export const deprecateTaxon = createServerFn({ method: "POST" })
  .middleware([requireCuratorMiddleware])
  .inputValidator(
    z.object({
      id: z.number(),
      replaced_by_id: z.number().optional().nullable(),
    })
  )
  .handler(async ({ data }): Promise<TaxonDTO> => {
    const { id, replaced_by_id } = data;

    return await db.transaction(async (tx) => {
      const current = await getCurrentTaxonMinimal(tx, id);
      if (current.status !== "active") {
        throw new Error("Only active taxa can be deprecated.");
      }

      // Don't allow deprecating with active children
      const [{ activeChildren }] = await tx
        .select({ activeChildren: count() })
        .from(taxaTbl)
        .where(and(eq(taxaTbl.parentId, id), eq(taxaTbl.status, "active")));

      if (Number(activeChildren) > 0) {
        throw new Error("Cannot deprecate a taxon that has active children.");
      }

      if (replaced_by_id) {
        if (replaced_by_id === id)
          throw new Error("Taxon cannot replace itself.");
        const replacement = await getCurrentTaxonMinimal(tx, replaced_by_id);
        if (replacement.status !== "active") {
          throw new Error("Replacement taxon must be active.");
        }
      }

      await tx
        .update(taxaTbl)
        .set({ status: "deprecated", replacedById: replaced_by_id ?? null })
        .where(eq(taxaTbl.id, id));

      const [dto] = await tx
        .select(selectTaxonDTO)
        .from(taxaTbl)
        .innerJoin(sci, sciJoinPred)
        .leftJoin(common, commonJoinPred)
        .where(eq(taxaTbl.id, id))
        .limit(1);

      if (!dto) throw notFound();
      return dto;
    });
  });
