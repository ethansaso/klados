import { notFound } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireCuratorMiddleware } from "../../auth/serverFnMiddleware";
import { deleteTraitSet } from "../../domain/traits/service";

export const deleteTraitSetFn = createServerFn({ method: "POST" })
  .middleware([requireCuratorMiddleware])
  .inputValidator(z.object({ id: z.number().int().positive() }))
  .handler(async ({ data }): Promise<{ id: number }> => {
    const { id } = data;

    const deleted = await deleteTraitSet({ id });
    if (!deleted) {
      throw notFound();
    }

    return deleted;
  });
