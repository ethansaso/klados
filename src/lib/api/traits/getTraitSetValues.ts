import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getTraitSetValues } from "../../domain/traits/service";
import type { TraitValueDTO } from "../../domain/traits/types";

export const getTraitSetValuesFn = createServerFn({ method: "GET" })
  .inputValidator(z.object({ set_id: z.number().int().positive() }))
  .handler(async ({ data }): Promise<TraitValueDTO[]> => {
    const { set_id } = data;

    return getTraitSetValues({ setId: set_id });
  });
