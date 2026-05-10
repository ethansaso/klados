import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { listFeatures } from "../../domain/features/service";
import type { FeaturePaginatedResult } from "../../domain/features/types";
import { PaginationSchema } from "../../validation/pagination";

export const listFeaturesFn = createServerFn({ method: "GET" })
  .inputValidator(
    PaginationSchema.extend({
      q: z.string().optional(),
      ids: z.array(z.number()).optional(),
    }),
  )
  .handler(async ({ data }): Promise<FeaturePaginatedResult> => {
    const { q, ids, page, pageSize } = data;

    return listFeatures({
      q,
      ids,
      page,
      pageSize,
    });
  });
