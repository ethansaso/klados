import { createServerFn } from "@tanstack/react-start";
import z from "zod";
import { getTaxonCharacterDisplayGroups } from "../../domain/character-states/service";
import { TaxonCharacterDisplayGroupDTO } from "../../domain/character-states/types";

export const getTaxonCharacterDisplayGroupsFn = createServerFn({
  method: "GET",
})
  .inputValidator(
    z.object({
      taxonId: z.number().int().nonnegative(),
    })
  )
  .handler(async ({ data }): Promise<TaxonCharacterDisplayGroupDTO[]> => {
    const { taxonId } = data;
    return getTaxonCharacterDisplayGroups({ taxonId });
  });
