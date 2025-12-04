import { queryOptions } from "@tanstack/react-query";
import { getCharacterFn } from "../api/characters/getCharacter";
import { listCharactersFn } from "../api/characters/listCharacters";
import { CharacterPaginatedResult } from "../domain/characters/types";

export const charactersQueryOptions = (
  page: number,
  pageSize: number,
  opts?: { q?: string }
) =>
  queryOptions<CharacterPaginatedResult>({
    queryKey: ["characters", { page, pageSize, q: opts?.q ?? null }],
    queryFn: () =>
      listCharactersFn({ data: { page, pageSize: pageSize, ...opts } }),
    staleTime: 60_000,
  });

export const characterQueryOptions = (id: number) =>
  queryOptions({
    queryKey: ["character", id] as const,
    queryFn: () => getCharacterFn({ data: { id } }),
    staleTime: 60_000,
  });
