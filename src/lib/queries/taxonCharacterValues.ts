import { queryOptions } from "@tanstack/react-query";
import { getTaxonCharacterValues } from "../serverFns/taxonCharacterValues";

// TODO: query key validity
export const taxonCharacterValuesQueryOptions = (taxonId: number) =>
  queryOptions({
    queryKey: ["taxonCharacters", taxonId],
    queryFn: () => getTaxonCharacterValues({ data: { taxonId } }),
  });
