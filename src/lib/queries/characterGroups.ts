import { queryOptions } from "@tanstack/react-query";
import {
  getCharacterGroup,
  listCharacterGroups,
} from "../serverFns/character-groups/fns";
import {
  CharacterGroupDetailDTO,
  CharacterGroupPaginatedResult,
} from "../serverFns/character-groups/types";

export const characterGroupsQueryOptions = (
  page: number,
  pageSize: number,
  opts?: { q?: string }
) =>
  queryOptions<CharacterGroupPaginatedResult>({
    queryKey: ["characterGroups", { page, pageSize, q: opts?.q ?? null }],
    queryFn: () =>
      listCharacterGroups({ data: { page, pageSize: pageSize, ...opts } }),
    staleTime: 60_000,
  });

export const characterGroupQueryOptions = (id: number) =>
  queryOptions({
    queryKey: ["characterGroup", id] as const,
    queryFn: () =>
      getCharacterGroup({ data: { id } }) as Promise<CharacterGroupDetailDTO>,
    staleTime: 60_000,
  });
