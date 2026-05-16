import { queryOptions } from "@tanstack/react-query";
import { getLookalikeDetailsForTaxaFn } from "../server-fns/lookalikes/getLookalikeDetailsForTaxaFn";
import { getLookalikesForTaxonFn } from "../server-fns/lookalikes/getLookalikesForTaxonFn";

export const lookalikesQueryOptions = (id: number) =>
  queryOptions({
    queryKey: ["taxa", id, "lookalikes"],
    queryFn: () => getLookalikesForTaxonFn({ data: { id } }),
  });

export const lookalikeDetailsQueryOptions = (
  taxonId: number,
  lookalikeId: number,
) =>
  queryOptions({
    queryKey: ["lookalikeDetails", taxonId, lookalikeId],
    queryFn: () =>
      getLookalikeDetailsForTaxaFn({ data: { taxonId, lookalikeId } }),
  });
