import { keepPreviousData, queryOptions } from "@tanstack/react-query";
import type { FilterChip } from "../domain/filter-chips/types";
import type { TaxonFilterToken } from "../domain/taxa/search";
import { resolveFilterChipsFn } from "../server-fns/filter-chips/resolveFilterChipsFn";

/**
 * Labels for character filter chips.
 * Deliberately holds previous results to avoid flashing.
 */
export const filterChipsQueryOptions = (
  tokens: TaxonFilterToken[],
) =>
  queryOptions<FilterChip[]>({
    queryKey: ["character-filter-chips", tokens],
    queryFn: () => resolveFilterChipsFn({ data: { tokens } }),
    enabled: tokens.length > 0,
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  });
