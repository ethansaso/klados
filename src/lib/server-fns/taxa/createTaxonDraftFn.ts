import { notFound } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { TAXON_RANKS_DESCENDING } from "../../../../db/schema/taxa/taxon";
import { requireCuratorMiddleware } from "../../auth/serverFnMiddleware";
import { createTaxonDraft } from "../../domain/taxa/service";
import type { TaxonDTO } from "../../domain/taxa/types";
import { nameItemSchema } from "../../domain/taxon-names/validation";

export const createTaxonDraftFn = createServerFn({ method: "POST" })
  .middleware([requireCuratorMiddleware])
  .validator(
    z.object({
      acceptedName: z.string().nonempty(),
      parentId: z.number().int().nullable(),
      rank: z.enum(TAXON_RANKS_DESCENDING),
      sourceGbifId: z.number().int().nullable().optional(),
      sourceInatId: z.number().int().nullable().optional(),
      names: z.array(nameItemSchema).optional(),
      mediaIds: z.array(z.number().int()).optional(),
    }),
  )
  .handler(async ({ data }): Promise<TaxonDTO> => {
    const dto = await createTaxonDraft(data);

    // Rare but still worth catching
    if (!dto) {
      throw notFound();
    }

    return dto;
  });
