import { notFound } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireCuratorMiddleware } from "../../auth/serverFnMiddleware";
import { deleteTaxon } from "../../domain/taxa/service";

export const deleteTaxonFn = createServerFn({ method: "POST" })
  .middleware([requireCuratorMiddleware])
  .inputValidator(z.object({ id: z.number() }))
  .handler(async ({ data }): Promise<{ id: number }> => {
    const result = await deleteTaxon({ id: data.id });

    if (!result) {
      throw notFound();
    }

    return result;
  });
