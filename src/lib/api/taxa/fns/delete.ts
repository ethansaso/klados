import { notFound } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "../../../../db/client";
import { taxon as taxaTbl } from "../../../../db/schema/taxa/taxon";
import { requireCuratorMiddleware } from "../../../auth/serverFnMiddleware";
import { getChildCount, getCurrentTaxonMinimal } from "../utils";

export const deleteTaxon = createServerFn({ method: "POST" })
  .middleware([requireCuratorMiddleware])
  .inputValidator(z.object({ id: z.number() }))
  .handler(async ({ data }): Promise<{ id: number }> => {
    const { id } = data;

    return await db.transaction(async (tx) => {
      const current = await getCurrentTaxonMinimal(tx, id);
      if (current.status !== "draft") {
        throw new Error("Only draft taxa can be deleted.");
      }

      const childCount = await getChildCount(tx, id);
      if (childCount > 0) {
        throw new Error("Cannot delete a taxon that has children.");
      }

      const deleted = await tx
        .delete(taxaTbl)
        .where(eq(taxaTbl.id, id))
        .returning({ id: taxaTbl.id });

      if (deleted.length === 0) throw notFound();
      return deleted[0];
    });
  });
