import { notFound } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireCuratorMiddleware } from "../../auth/serverFnMiddleware";
import { deleteTraitValue } from "../../domain/traits/service";

export const deleteTraitValueFn = createServerFn({ method: "POST" })
  .middleware([requireCuratorMiddleware])
  .inputValidator(z.object({ id: z.int().positive() }))
  .handler(async ({ data }): Promise<{ id: number }> => {
    const { id } = data;

    const deleted = await deleteTraitValue({ id });
    if (!deleted) {
      throw notFound();
    }

    return deleted;
  });
