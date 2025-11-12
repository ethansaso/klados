import { queryOptions } from "@tanstack/react-query";
import { getCharacter, listCharacters } from "../serverFns/characters/fns";
import {
  CharacterDTO,
  CharacterPaginatedResult,
} from "../serverFns/characters/types";

export const charactersQueryOptions = (
  page: number,
  pageSize: number,
  opts?: { q?: string }
) =>
  queryOptions<CharacterPaginatedResult>({
    queryKey: ["characters", { page, pageSize, q: opts?.q ?? null }],
    queryFn: () =>
      listCharacters({ data: { page, pageSize: pageSize, ...opts } }),
    staleTime: 60_000,
  });

export const characterQueryOptions = (id: number) =>
  queryOptions({
    queryKey: ["character", id] as const,
    queryFn: () => getCharacter({ data: { id } }) as Promise<CharacterDTO>,
    staleTime: 60_000,
  });
