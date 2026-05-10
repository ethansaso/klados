import { queryOptions } from "@tanstack/react-query";
import { getSourcesForTaxonFn } from "../server-fns/taxon-sources/getSourcesForTaxonFn";

export const sourcesForTaxonQueryOptions = (id: number) =>
  queryOptions({
    queryKey: ["taxon", id, "sources"],
    queryFn: () => getSourcesForTaxonFn({ data: { id } }),
    staleTime: 5 * 60_000,
  });
