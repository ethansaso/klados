import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { listTraitValuesByCharacter } from "../../domain/traits/service";
import type { TraitValuePaginatedResult } from "../../domain/traits/types";
import { PaginationSchema } from "../../validation/pagination";

export const listTraitValuesFn = createServerFn({ method: "GET" })
  .validator(
    PaginationSchema.extend({
      characterId: z.coerce.number().int().positive(),
      q: z.string().optional(),
    }),
  )
  .handler(async ({ data }): Promise<TraitValuePaginatedResult> => {
    const { characterId, page, pageSize, q } = data;

    return listTraitValuesByCharacter({
      characterId,
      page,
      pageSize,
      q,
    });
  });
