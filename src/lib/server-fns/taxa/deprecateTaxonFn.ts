import { notFound } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireCuratorMiddleware } from "../../auth/serverFnMiddleware";
import { archiveTaxon } from "../../domain/taxa/service";
import type { TaxonDTO } from "../../domain/taxa/types";

export const archiveTaxonFn = createServerFn({ method: "POST" })
  .middleware([requireCuratorMiddleware])
  .validator(
    z.object({
      id: z.number(),
      replacedById: z.number().optional().nullable(),
    }),
  )
  .handler(async ({ data }): Promise<TaxonDTO> => {
    const dto = await archiveTaxon({
      id: data.id,
      replacedById: data.replacedById ?? null,
    });

    if (!dto) {
      throw notFound();
    }

    return dto;
  });
