import { createServerFn } from "@tanstack/react-start";
import { requireCuratorMiddleware } from "../../auth/serverFnMiddleware";
import { updateTraitValues } from "../../domain/traits/service";
import type { TraitValueDTO } from "../../domain/traits/types";
import { updateTraitValuesSchema } from "../../domain/traits/validation";

export const updateTraitValuesFn = createServerFn({ method: "POST" })
  .middleware([requireCuratorMiddleware])
  .validator(updateTraitValuesSchema)
  .handler(async ({ data }): Promise<TraitValueDTO[]> => {
    return updateTraitValues(data);
  });
