import { createServerFn } from "@tanstack/react-start";
import z from "zod";
import { getTaxonStates } from "../../domain/states/service";
import type { TaxonCharacterGroupStateDTO } from "../../domain/states/types";

export const getTaxonCharacterStatesFn = createServerFn({ method: "GET" })
  .inputValidator(
    z.object({
      taxonId: z.number().int().nonnegative(),
    }),
  )
  .handler(async ({ data }): Promise<TaxonCharacterGroupStateDTO[]> => {
    const { taxonId } = data;
    return getTaxonStates({ taxonId });
  });
