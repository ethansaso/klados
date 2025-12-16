import { notFound } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import z from "zod";
import { getSourcesForTaxon } from "../../domain/taxon-sources/service";
import { TaxonSourceDTO } from "../../domain/taxon-sources/types";

export const getSourcesForTaxonFn = createServerFn({ method: "GET" })
  .inputValidator(
    z.object({
      id: z.number(),
    })
  )
  .handler(async ({ data }): Promise<TaxonSourceDTO[]> => {
    const detail = await getSourcesForTaxon({ id: data.id });

    if (!detail) {
      throw notFound();
    }

    return detail;
  });
