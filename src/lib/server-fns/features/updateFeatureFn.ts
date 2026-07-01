import { createServerFn } from "@tanstack/react-start";
import { requireCuratorMiddleware } from "../../auth/serverFnMiddleware";
import { updateFeature } from "../../domain/features/service";
import { updateFeatureSchema } from "../../domain/features/validation";

export const updateFeatureFn = createServerFn({ method: "POST" })
  .middleware([requireCuratorMiddleware])
  .validator(updateFeatureSchema)
  .handler(async ({ data }) => {
    const updated = await updateFeature(data);
    return updated;
  });
