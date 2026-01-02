import { createServerFn } from "@tanstack/react-start";
import z from "zod";
import { listTraitSetValues } from "../../domain/traits/service";
import { TraitValuePaginatedResult } from "../../domain/traits/types";
import { PaginationSchema } from "../../validation/pagination";

export const listTraitSetValuesFn = createServerFn({ method: "GET" })
  .inputValidator(
    PaginationSchema.extend({
      setId: z.number().int().positive(),
      kind: z.enum(["canonical", "alias"]).optional(),
      q: z.string().optional(),
    })
  )
  .handler(async ({ data }): Promise<TraitValuePaginatedResult> => {
    const { setId, page, pageSize, q } = data;

    return listTraitSetValues({ setId, page, pageSize, kind: data.kind, q });
  });
