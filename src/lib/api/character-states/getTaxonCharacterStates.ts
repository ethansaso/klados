import { createServerFn } from "@tanstack/react-start";
import z from "zod";
import { getTaxonCharacterStates } from "../../domain/character-states/service";
import { TaxonCharacterStateDTO } from "../../domain/character-states/types";

export const getTaxonCharacterStatesFn = createServerFn({ method: "GET" })
  .inputValidator(
    z.object({
      taxonId: z.number().int().nonnegative(),
    })
  )
  .handler(async ({ data }): Promise<TaxonCharacterStateDTO[]> => {
    const { taxonId } = data;
    return getTaxonCharacterStates({ taxonId });
  });
