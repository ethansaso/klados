import { queryOptions } from "@tanstack/react-query";
import { getTaxonCharacterValues } from "../serverFns/taxonCharacterValues";

export const taxonCharacterValuesQueryOptions = (taxonId: number) =>
  queryOptions({
    queryKey: ["taxonCharacterValues", taxonId],
    queryFn: () => getTaxonCharacterValues({ data: { taxonId } }),
    staleTime: 60_000,
  });
