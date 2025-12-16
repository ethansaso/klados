import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireCuratorMiddleware } from "../../auth/serverFnMiddleware";
import { createTraitValue } from "../../domain/traits/service";
import type { TraitValueDTO } from "../../domain/traits/types";

export const createTraitValueFn = createServerFn({ method: "POST" })
  .middleware([requireCuratorMiddleware])
  .inputValidator(
    z.object({
      setId: z.coerce.number().int().positive(),
      key: z.string().min(1).max(100),
      label: z.string().min(1).max(200),
      canonicalValueId: z.coerce.number().int().positive().optional(),
    })
  )
  .handler(async ({ data }): Promise<TraitValueDTO> => {
    const dto = await createTraitValue(data);

    return dto;
  });
