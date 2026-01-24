import { createServerFn } from "@tanstack/react-start";
import z from "zod";
import { getLookalikesForTaxon } from "../../domain/lookalikes/service";
import { TaxonLookalikeDTO } from "../../domain/lookalikes/types";

export const getLookalikesForTaxonFn = createServerFn({
  method: "POST",
})
  .inputValidator(
    z.object({
      id: z
        .int("Taxon ID must be an integer.")
        .nonnegative("Taxon ID must be non-negative."),
    }),
  )
  .handler(async ({ data }): Promise<TaxonLookalikeDTO[]> => {
    return await getLookalikesForTaxon(data.id, 10);
  });
