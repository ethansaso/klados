import { queryOptions } from "@tanstack/react-query";
import type { CharacterPaginatedResult } from "../domain/characters/types";
import { getCharacterFn } from "../server-fns/characters/getCharacterFn";
import { listCharactersFn } from "../server-fns/characters/listCharactersFn";

export const charactersQueryOptions = (
  page: number,
  pageSize: number,
  opts?: { q?: string },
) =>
  queryOptions<CharacterPaginatedResult>({
    queryKey: ["characters", { page, pageSize, q: opts?.q ?? null }],
    queryFn: () => listCharactersFn({ data: { page, pageSize, ...opts } }),
  });

export const characterQueryOptions = (id: number) =>
  queryOptions({
    queryKey: ["characters", id] as const,
    queryFn: () => getCharacterFn({ data: { id } }),
  });
