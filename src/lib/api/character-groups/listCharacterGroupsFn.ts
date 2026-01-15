import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { listCharacterGroups } from "../../domain/character-groups/service";
import type { CharacterGroupPaginatedResult } from "../../domain/character-groups/types";
import { PaginationSchema } from "../../validation/pagination";

export const listCharacterGroupsFn = createServerFn({ method: "GET" })
  .inputValidator(
    PaginationSchema.extend({
      q: z.string().optional(),
      ids: z.array(z.number()).optional(),
    })
  )
  .handler(async ({ data }): Promise<CharacterGroupPaginatedResult> => {
    const { q, ids, page, pageSize } = data;

    return listCharacterGroups({
      q,
      ids,
      page,
      pageSize,
    });
  });
