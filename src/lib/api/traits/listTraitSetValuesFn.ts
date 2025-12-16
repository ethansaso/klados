import { createServerFn } from "@tanstack/react-start";
import z from "zod";
import { listTraitSetValues } from "../../domain/traits/service";
import { TraitValuePaginatedResult } from "../../domain/traits/types";

export const listTraitSetValuesFn = createServerFn({ method: "GET" })
  .inputValidator(
    z.object({
      setId: z.number().int().positive(),
      page: z.number().int().min(1).default(1),
      pageSize: z.number().int().min(1).max(100).default(20),
    })
  )
  .handler(async ({ data }): Promise<TraitValuePaginatedResult> => {
    const { setId, page, pageSize } = data;

    return listTraitSetValues({ setId, page, pageSize });
  });
