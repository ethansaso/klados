import { queryOptions } from "@tanstack/react-query";
import { listCharacterGroups } from "../serverFns/character-groups/fns";
import { CharacterGroupPaginatedResult } from "../serverFns/character-groups/types";

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
