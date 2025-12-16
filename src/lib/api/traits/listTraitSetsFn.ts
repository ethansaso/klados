import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { listTraitSets } from "../../domain/traits/service";
import type { TraitSetPaginatedResult } from "../../domain/traits/types";
import { PaginationSchema } from "../../validation/pagination";

export const listTraitSetsFn = createServerFn({ method: "GET" })
  .inputValidator(
    PaginationSchema.extend({
      q: z.string().optional(),
      ids: z.array(z.number()).optional(),
    })
  )
  .handler(async ({ data }): Promise<TraitSetPaginatedResult> => {
    const { q, ids, page, pageSize } = data;

    return listTraitSets({
      q,
      ids,
      page,
      pageSize,
    });
  });
