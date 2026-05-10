import { createServerFn } from "@tanstack/react-start";
import z from "zod";
import { getLookalikeComparisonDetailForTaxa } from "../../domain/lookalikes/service";
import { type LookalikeComparisonDetailDTO } from "../../domain/lookalikes/types";

export const getLookalikeDetailsForTaxaFn = createServerFn({
  method: "POST",
})
  .inputValidator(
    z.object({
      taxonId: z
        .int("Taxon ID must be an integer.")
        .nonnegative("Taxon ID must be non-negative."),
      lookalikeId: z
        .int("Lookalike Taxon ID must be an integer.")
        .nonnegative("Lookalike Taxon ID must be non-negative."),
    }),
  )
  .handler(async ({ data }): Promise<LookalikeComparisonDetailDTO> => {
    return await getLookalikeComparisonDetailForTaxa({
      taxonId: data.taxonId,
      lookalikeId: data.lookalikeId,
    });
  });
