import { queryOptions } from "@tanstack/react-query";
import { listCharacters } from "../serverFns/characters/fns";
import { CharacterPaginatedResult } from "../serverFns/characters/types";

export const charactersQueryOptions = (
  page: number,
  pageSize: number,
  opts?: { q?: string }
) =>
  queryOptions<CharacterPaginatedResult>({
    queryKey: ["characters", { page, pageSize, q: opts?.q ?? null }],
    queryFn: () => listCharacters({ data: { page, pageSize, ...opts } }),
    staleTime: 60_000,
  });
