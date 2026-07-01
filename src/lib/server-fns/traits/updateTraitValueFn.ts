import { createServerFn } from "@tanstack/react-start";
import { updateTraitValue } from "../../domain/traits/service";
import type { TraitValueDTO } from "../../domain/traits/types";
import { updateTraitValueSchema } from "../../domain/traits/validation";

export const updateTraitValueFn = createServerFn({ method: "GET" })
  .validator(updateTraitValueSchema)
  .handler(async ({ data }): Promise<TraitValueDTO> => {
    return await updateTraitValue(data);
  });
