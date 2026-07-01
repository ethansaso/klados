import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getFeature } from "../../domain/features/service";
import type { FeatureDetailDTO } from "../../domain/features/types";

export const getFeatureFn = createServerFn({ method: "GET" })
  .validator(
    z.object({
      id: z.number().int().nonnegative(),
    }),
  )
  .handler(async ({ data }): Promise<FeatureDetailDTO | null> => {
    const { id } = data;

    const feature = await getFeature({ id });
    return feature;
  });
