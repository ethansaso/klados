import { queryOptions } from "@tanstack/react-query";
import { getTaxonCharacterDisplayGroupsFn } from "../api/character-states/getTaxonCharacterDisplayGroups";
import { getTaxonCharacterStatesFn } from "../api/character-states/getTaxonCharacterStates";

export const taxonCharacterStatesQueryOptions = (taxonId: number) =>
  queryOptions({
    queryKey: ["taxon", taxonId, "characterStates"],
    queryFn: () => getTaxonCharacterStatesFn({ data: { taxonId } }),
    staleTime: 60_000,
  });

export const taxonCharacterDisplayGroupsQueryOptions = (taxonId: number) =>
  queryOptions({
    queryKey: ["taxon", taxonId, "characterDisplayGroups"],
    queryFn: () => getTaxonCharacterDisplayGroupsFn({ data: { taxonId } }),
    staleTime: 60_000,
  });
