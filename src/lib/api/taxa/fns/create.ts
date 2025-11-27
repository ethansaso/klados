import { notFound } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "../../../../db/client";
import { taxonName as namesTbl } from "../../../../db/schema/taxa/name";
import {
  taxon as taxaTbl,
  TAXON_RANKS_DESCENDING,
} from "../../../../db/schema/taxa/taxon";
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
import { assertExactlyOneAcceptedScientificName } from "../utils";

export const createTaxonDraft = createServerFn({ method: "POST" })
  .middleware([requireCuratorMiddleware])
  .inputValidator(
    z.object({
      accepted_name: z.string().nonempty(),
      parent_id: z.int().nullable(),
      rank: z.enum(TAXON_RANKS_DESCENDING),
    })
  )
  .handler(async ({ data }): Promise<TaxonDTO> => {
    const { accepted_name, parent_id, rank } = data;

    return await db.transaction(async (tx) => {
      await assertHierarchyInvariant({
        tx,
        nextParentId: parent_id,
        nextRank: rank,
      });

      const [taxon] = await tx
        .insert(taxaTbl)
        .values({ parentId: parent_id, rank })
        .returning();

      await tx.insert(namesTbl).values({
        value: accepted_name,
        taxonId: taxon.id,
        locale: "sci",
        isPreferred: true,
      });

      await assertExactlyOneAcceptedScientificName(tx, taxon.id);

      const [dto] = await tx
        .select(selectTaxonDTO)
        .from(taxaTbl)
        .innerJoin(sci, sciJoinPred)
        .leftJoin(common, commonJoinPred)
        .where(eq(taxaTbl.id, taxon.id))
        .limit(1);

      if (!dto) throw notFound();
      return dto;
    });
  });
