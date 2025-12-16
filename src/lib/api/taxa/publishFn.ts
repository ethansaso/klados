import { notFound } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireCuratorMiddleware } from "../../auth/serverFnMiddleware";
import { publishTaxon } from "../../domain/taxa/service";
import { TaxonDTO } from "../../domain/taxa/types";

export const publishTaxonFn = createServerFn({ method: "POST" })
  .middleware([requireCuratorMiddleware])
  .inputValidator(z.object({ id: z.number() }))
  .handler(async ({ data }): Promise<TaxonDTO> => {
    const { id } = data;

    const dto = await publishTaxon({ id });
    if (!dto) {
      throw notFound();
    }

    return dto;
  });
