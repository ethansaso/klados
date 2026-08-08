import { keepPreviousData, queryOptions } from "@tanstack/react-query";
import type { CharacterFilterChip } from "../domain/filter-chips/types";
import type { CharacterStateFilterToken } from "../domain/taxa/search";
import { resolveCharacterFilterChipsFn } from "../server-fns/filter-chips/resolveCharacterFilterChipsFn";

/**
 * Labels for character filter chips.
 * Deliberately holds previous results to avoid flashing.
 */
export const characterFilterChipsQueryOptions = (
  tokens: CharacterStateFilterToken[],
) =>
  queryOptions<CharacterFilterChip[]>({
    queryKey: ["character-filter-chips", tokens],
    queryFn: () => resolveCharacterFilterChipsFn({ data: { tokens } }),
    enabled: tokens.length > 0,
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  });
