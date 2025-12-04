import { queryOptions } from "@tanstack/react-query";
import { getCharacterGroupFn } from "../api/character-groups/getCharacterGroup";
import { listCharacterGroupsFn } from "../api/character-groups/listCharacterGroups";
import {
  CharacterGroupDetailDTO,
  CharacterGroupPaginatedResult,
} from "../domain/character-groups/types";

export const characterGroupsQueryOptions = (
  page: number,
  pageSize: number,
  opts?: { q?: string }
) =>
  queryOptions<CharacterGroupPaginatedResult>({
    queryKey: ["characterGroups", { page, pageSize, q: opts?.q ?? null }],
    queryFn: () =>
      listCharacterGroupsFn({ data: { page, pageSize: pageSize, ...opts } }),
    staleTime: 60_000,
  });

export const characterGroupQueryOptions = (id: number) =>
  queryOptions({
    queryKey: ["characterGroup", id] as const,
    queryFn: () =>
      getCharacterGroupFn({ data: { id } }) as Promise<CharacterGroupDetailDTO>,
    staleTime: 60_000,
  });
