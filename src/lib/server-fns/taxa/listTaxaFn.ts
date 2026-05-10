import { createServerFn } from "@tanstack/react-start";
import { TaxonSearchSchema } from "../../domain/taxa/search";
import { listTaxa } from "../../domain/taxa/service";
import type { TaxonPaginatedResult } from "../../domain/taxa/types";

export const listTaxaFn = createServerFn({ method: "GET" })
  .inputValidator(TaxonSearchSchema)
  .handler(async ({ data }): Promise<TaxonPaginatedResult> => {
    return listTaxa(data);
  });
