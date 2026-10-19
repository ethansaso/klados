import { createFileRoute, notFound } from "@tanstack/react-router";
import {
  formatTaxonSegment,
  parseTaxonSegment,
} from "../../../../lib/utils/formatting/taxonUrl";

/** Taxon URLs carry a decorative name slug after the id: /taxa/5-Amanita-muscaria. */
export const Route = createFileRoute("/_app/taxa/$id")({
  params: {
    parse: ({ id }) => {
      const parsed = parseTaxonSegment(id);
      if (!parsed) throw notFound();
      return parsed;
    },
    stringify: ({ id, slug }) => ({ id: formatTaxonSegment({ id, slug }) }),
  },
});
