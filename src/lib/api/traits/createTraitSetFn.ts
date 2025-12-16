import { notFound } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { requireCuratorMiddleware } from "../../auth/serverFnMiddleware";
import { createTraitSet } from "../../domain/traits/service";
import type { TraitSetDTO } from "../../domain/traits/types";
import { createTraitSetSchema } from "../../domain/traits/validation";

export const createTraitSetFn = createServerFn({ method: "POST" })
  .middleware([requireCuratorMiddleware])
  .inputValidator(createTraitSetSchema)
  .handler(async ({ data }): Promise<TraitSetDTO> => {
    const dto = await createTraitSet({
      key: data.key,
      label: data.label,
      description: data.description,
    });

    if (!dto) {
      throw notFound();
    }

    return dto;
  });
