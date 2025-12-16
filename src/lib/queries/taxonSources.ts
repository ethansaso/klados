import { queryOptions } from "@tanstack/react-query";
import { getSourcesForTaxonFn } from "../api/taxon-sources/getSourcesForTaxonFn";

export const sourceForTaxonQueryOptions = (id: number) =>
  queryOptions({
    queryKey: ["source", id],
    queryFn: () => getSourcesForTaxonFn({ data: { id } }),
    staleTime: 5 * 60_000,
  });
