import { createServerFn } from "@tanstack/react-start";

import { requireCuratorMiddleware } from "../../auth/serverFnMiddleware";
import { createFeature } from "../../domain/features/service";
import type { FeatureDTO } from "../../domain/features/types";
import { createFeatureSchema } from "../../domain/features/validation";

export const createFeatureFn = createServerFn({ method: "POST" })
  .middleware([requireCuratorMiddleware])
  .validator(createFeatureSchema)
  .handler(async ({ data }): Promise<FeatureDTO> => {
    const dto = await createFeature(data);

    if (!dto) {
      throw new Error("Failed to create feature.");
    }

    return dto;
  });
