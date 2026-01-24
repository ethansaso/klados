import { queryOptions } from "@tanstack/react-query";
import { getLookalikeDetailsForTaxaFn } from "../api/lookalikes/getLookalikeDetailsForTaxaFn";
import { getLookalikesForTaxonFn } from "../api/lookalikes/getLookalikesForTaxonFn";

export const lookalikesQueryOptions = (id: number) =>
  queryOptions({
    queryKey: ["taxon", id, "lookalikes"],
    queryFn: () => getLookalikesForTaxonFn({ data: { id } }),
    staleTime: 60_000,
  });

export const lookalikeDetailsQueryOptions = (
  taxonId: number,
  lookalikeId: number,
) =>
  queryOptions({
    queryKey: ["lookalikeDetails", taxonId, lookalikeId],
    queryFn: () =>
      getLookalikeDetailsForTaxaFn({ data: { taxonId, lookalikeId } }),
    staleTime: 60_000,
  });
