import { notFound } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { TAXON_RANKS_DESCENDING } from "../../../db/schema/taxa/taxon";
import { requireCuratorMiddleware } from "../../auth/serverFnMiddleware";
import { createTaxonDraft } from "../../domain/taxa/service";
import { TaxonDTO } from "../../domain/taxa/types";

export const createTaxonDraftFn = createServerFn({ method: "POST" })
  .middleware([requireCuratorMiddleware])
  .inputValidator(
    z.object({
      accepted_name: z.string().nonempty(),
      parent_id: z.number().int().nullable(),
      rank: z.enum(TAXON_RANKS_DESCENDING),
    })
  )
  .handler(async ({ data }): Promise<TaxonDTO> => {
    const { accepted_name, parent_id, rank } = data;

    const dto = await createTaxonDraft({
      acceptedName: accepted_name,
      parentId: parent_id,
      rank,
    });

    // Rare but still worth catching
    if (!dto) {
      throw notFound();
    }

    return dto;
  });
