import { createServerFn } from "@tanstack/react-start";
import z from "zod";
import { listModifiers } from "../../domain/modifiers/service";
import { type ModifierPaginatedResult } from "../../domain/modifiers/types";
import { PaginationSchema } from "../../validation/pagination";

export const listModifiersFn = createServerFn({ method: "GET" })
  .validator(
    PaginationSchema.extend({
      groupId: z.number().int().positive().optional(),
      q: z.string().optional(),
    }),
  )
  .handler(async ({ data }): Promise<ModifierPaginatedResult> => {
    return listModifiers(data);
  });
