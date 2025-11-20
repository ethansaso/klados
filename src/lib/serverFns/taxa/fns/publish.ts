import { notFound } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "../../../../db/client";
import { taxon as taxaTbl } from "../../../../db/schema/taxa/taxon";
import { requireCuratorMiddleware } from "../../../auth/serverFnMiddleware";
import { assertHierarchyInvariant } from "../../../utils/assertHierarchyInvariant";
import {
  common,
  commonJoinPred,
  sci,
  sciJoinPred,
  selectTaxonDTO,
} from "../sqlAdapters";
import { TaxonDTO } from "../types";
import {
  assertExactlyOneAcceptedScientificName,
  getCurrentTaxonMinimal,
} from "../utils";

export const publishTaxon = createServerFn({ method: "POST" })
  .middleware([requireCuratorMiddleware])
  .inputValidator(z.object({ id: z.number() }))
  .handler(async ({ data }): Promise<TaxonDTO> => {
    const { id } = data;
    return await db.transaction(async (tx) => {
      const current = await getCurrentTaxonMinimal(tx, id);
      if (current.status !== "draft") {
        throw new Error("Only draft taxa can be published.");
      }

      // Ensure structure is valid at publish time and a scientific name exists.
      await assertHierarchyInvariant({
        tx,
        nextParentId: current.parentId,
        nextRank: current.rank,
      });
      await assertExactlyOneAcceptedScientificName(tx, id);

      await tx
        .update(taxaTbl)
        .set({ status: "active" })
        .where(eq(taxaTbl.id, id));

      // Return updated DTO
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
