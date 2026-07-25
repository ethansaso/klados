import { createServerFn } from "@tanstack/react-start";
import { requireCuratorMiddleware } from "../../auth/serverFnMiddleware";
import { updateTraitValue } from "../../domain/traits/service";
import type { TraitValueDTO } from "../../domain/traits/types";
import { updateTraitValueSchema } from "../../domain/traits/validation";

export const updateTraitValueFn = createServerFn({ method: "POST" })
  .middleware([requireCuratorMiddleware])
  .validator(updateTraitValueSchema)
  .handler(async ({ data }): Promise<TraitValueDTO> => {
    return updateTraitValue(data);
  });
