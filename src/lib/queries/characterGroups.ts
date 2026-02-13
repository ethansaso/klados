import { queryOptions } from "@tanstack/react-query";
import { getCharacterGroupFn } from "../api/character-groups/getCharacterGroupFn";
import { listCharacterGroupsFn } from "../api/character-groups/listCharacterGroupsFn";
import type {
  CharacterGroupDetailDTO,
  CharacterGroupPaginatedResult,
} from "../domain/features/types";

export const characterGroupsQueryOptions = (
  page: number,
  pageSize: number,
  opts?: { q?: string },
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
