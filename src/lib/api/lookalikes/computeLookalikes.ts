import { createServerFn } from "@tanstack/react-start";
import z from "zod";
import {
  getLookalikeComparisonDetailForTaxa,
  getLookalikesForTaxon,
} from "../../domain/lookalikes/service";
import {
  LookalikeComparisonDetailDTO,
  TaxonLookalikeDTO,
} from "../../domain/lookalikes/types";

export const getLookalikesForTaxonFn = createServerFn({
  method: "POST",
})
  .inputValidator(
    z.object({
      id: z
        .int("Taxon ID must be an integer.")
        .nonnegative("Taxon ID must be non-negative."),
    })
  )
  .handler(async ({ data }): Promise<TaxonLookalikeDTO[]> => {
    return await getLookalikesForTaxon(data.id, 10);
  });

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
    })
  )
  .handler(async ({ data }): Promise<LookalikeComparisonDetailDTO> => {
    return await getLookalikeComparisonDetailForTaxa({
      taxonId: data.taxonId,
      lookalikeId: data.lookalikeId,
    });
  });
