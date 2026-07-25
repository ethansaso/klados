import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireCuratorMiddleware } from "../../auth/serverFnMiddleware";
import { createTraitValue } from "../../domain/traits/service";
import type { TraitValueDTO } from "../../domain/traits/types";
import { createTraitValueSchema } from "../../domain/traits/validation";

export const createTraitValueFn = createServerFn({ method: "POST" })
  .middleware([requireCuratorMiddleware])
  .validator(
    createTraitValueSchema.extend({
      characterId: z.coerce.number().int().positive(),
    }),
  )
  .handler(async ({ data }): Promise<TraitValueDTO> => {
    return createTraitValue(data);
  });
