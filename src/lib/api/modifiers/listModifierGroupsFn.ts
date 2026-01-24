import { createServerFn } from "@tanstack/react-start";
import z from "zod";
import { listModifierGroups } from "../../domain/modifiers/service";
import { ModifierGroupPaginatedResult } from "../../domain/modifiers/types";
import { PaginationSchema } from "../../validation/pagination";

export const listModifierGroupsFn = createServerFn({ method: "GET" })
  .inputValidator(
    PaginationSchema.extend({
      q: z.string().optional(),
    }),
  )
  .handler(async ({ data }): Promise<ModifierGroupPaginatedResult> => {
    return listModifierGroups(data);
  });
