import { queryOptions } from "@tanstack/react-query";
import { getTaxonCharacterStatesFn } from "../server-fns/character-states/getTaxonCharacterStatesFn";

export const taxonCharacterStatesQueryOptions = (taxonId: number) =>
  queryOptions({
    queryKey: ["taxa", taxonId, "characterStates"],
    queryFn: () => getTaxonCharacterStatesFn({ data: { taxonId } }),
  });
