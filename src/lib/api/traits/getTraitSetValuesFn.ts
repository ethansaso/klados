import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getTraitSetValues } from "../../domain/traits/service";
import type { TraitValueDTO } from "../../domain/traits/types";

export const getTraitSetValuesFn = createServerFn({ method: "GET" })
  .inputValidator(z.object({ setId: z.number().int().positive() }))
  .handler(async ({ data }): Promise<TraitValueDTO[]> => {
    const { setId } = data;

    return getTraitSetValues({ setId });
  });
