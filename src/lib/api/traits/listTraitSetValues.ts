import { createServerFn } from "@tanstack/react-start";
import z from "zod";
import { listTraitSetValues } from "../../domain/traits/service";
import { TraitValuePaginatedResult } from "../../domain/traits/types";

export const listTraitSetValuesFn = createServerFn({ method: "GET" })
  .inputValidator(
    z.object({
      set_id: z.number().int().positive(),
      page: z.number().int().min(1).default(1),
      pageSize: z.number().int().min(1).max(100).default(20),
    })
  )
  .handler(async ({ data }): Promise<TraitValuePaginatedResult> => {
    const { set_id, page, pageSize } = data;

    return listTraitSetValues({ setId: set_id, page, pageSize });
  });
