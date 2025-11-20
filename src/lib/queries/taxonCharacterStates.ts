import { queryOptions } from "@tanstack/react-query";
import { getTaxonCharacterStates } from "../serverFns/character-states/taxonCharacterStates";

export const taxonCharacterStatesQueryOptions = (taxonId: number) =>
  queryOptions({
    queryKey: ["taxonCharacterValues", taxonId],
    queryFn: () => getTaxonCharacterStates({ data: { taxonId } }),
    staleTime: 60_000,
  });
