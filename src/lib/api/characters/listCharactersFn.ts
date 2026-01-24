import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { listCharacters } from "../../domain/characters/service";
import type { CharacterPaginatedResult } from "../../domain/characters/types";
import { PaginationSchema } from "../../validation/pagination";

export const listCharactersFn = createServerFn({ method: "GET" })
  .inputValidator(
    PaginationSchema.extend({
      q: z.string().optional(),
      ids: z.array(z.number()).optional(),
    })
  )
  .handler(async ({ data }): Promise<CharacterPaginatedResult> => {
    const { q, ids, page, pageSize } = data;

    return listCharacters({
      q,
      ids,
      page,
      pageSize,
    });
  });
