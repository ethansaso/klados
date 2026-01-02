import { queryOptions } from "@tanstack/react-query";
import {
  getLookalikeDetailsForTaxaFn,
  getLookalikesForTaxonFn,
} from "../api/lookalikes/computeLookalikes";

export const lookalikesQueryOptions = (id: number) =>
  queryOptions({
    queryKey: ["taxon", id, "lookalikes"],
    queryFn: () => getLookalikesForTaxonFn({ data: { id } }),
    staleTime: 60_000,
  });

export const lookalikeDetailsQueryOptions = (
  taxonId: number,
  lookalikeId: number
) =>
  queryOptions({
    queryKey: ["lookalikeDetails", taxonId, lookalikeId],
    queryFn: () =>
      getLookalikeDetailsForTaxaFn({ data: { taxonId, lookalikeId } }),
    staleTime: 60_000,
  });
