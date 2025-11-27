import { notFound } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireCuratorMiddleware } from "../../auth/serverFnMiddleware";
import { deprecateTaxon as deprecateTaxonDomain } from "../../domain/taxa/service";
import type { TaxonDTO } from "../../domain/taxa/types";

export const deprecateTaxonFn = createServerFn({ method: "POST" })
  .middleware([requireCuratorMiddleware])
  .inputValidator(
    z.object({
      id: z.number(),
      replaced_by_id: z.number().optional().nullable(),
    })
  )
  .handler(async ({ data }): Promise<TaxonDTO> => {
    const dto = await deprecateTaxonDomain({
      id: data.id,
      replacedById: data.replaced_by_id ?? null,
    });

    if (!dto) {
      throw notFound();
    }

    return dto;
  });
