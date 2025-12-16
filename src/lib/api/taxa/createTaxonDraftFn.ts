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
      acceptedName: z.string().nonempty(),
      parentId: z.number().int().nullable(),
      rank: z.enum(TAXON_RANKS_DESCENDING),
    })
  )
  .handler(async ({ data }): Promise<TaxonDTO> => {
    const dto = await createTaxonDraft(data);

    // Rare but still worth catching
    if (!dto) {
      throw notFound();
    }

    return dto;
  });
