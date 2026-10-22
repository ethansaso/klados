import { keepPreviousData, queryOptions } from "@tanstack/react-query";
import type {
  FeatureSuggestion,
  ModifierSuggestion,
  TraitSuggestion,
} from "../domain/suggestions/types";
import { listCharacterStateFilterSuggestionsFn } from "../server-fns/suggestions/listCharacterStateFilterSuggestionsFn";
import { listCharacterStateSuggestionsFn } from "../server-fns/suggestions/listCharacterStateSuggestionsFn";
import { listFeatureSuggestionsFn } from "../server-fns/suggestions/listFeatureSuggestionsFn";
import { listModifierStateSuggestionsFn } from "../server-fns/suggestions/listModifierStateSuggestionsFn";

export const modifierSuggestionsQueryOptions = (q: string) =>
  queryOptions({
    queryKey: ["modifierSuggestions", { q }] as const,
    queryFn: () =>
      listModifierStateSuggestionsFn({ data: { q, limit: 30 } }) as Promise<
        ModifierSuggestion[]
      >,
    staleTime: 5_000,
    // The modifier list stays up (and keyboard-navigable) while a search loads
    placeholderData: keepPreviousData,
  });

/** Suggestions for the taxa filters; `featureId` narrows, omitting it searches all. */
export const characterStateFilterSuggestionsQueryOptions = (opts: {
  q: string;
  featureId?: number;
}) =>
  queryOptions<TraitSuggestion[]>({
    queryKey: [
      "character-state-filter-suggestions",
      { q: opts.q, featureId: opts.featureId ?? null },
    ],
    queryFn: () =>
      listCharacterStateFilterSuggestionsFn({
        data: { q: opts.q, featureId: opts.featureId },
      }),
    enabled: opts.q.trim().length > 0,
  });

/** States for one feature's card in the taxon editor. */
export const characterStateSuggestionsQueryOptions = (
  featureId: number,
  q: string,
) =>
  queryOptions<TraitSuggestion[]>({
    queryKey: ["characterStateSuggestions", { featureId, q }] as const,
    queryFn: () =>
      listCharacterStateSuggestionsFn({ data: { featureId, q, limit: 20 } }),
    enabled: q.trim().length > 0,
    // Keep matches up while typing, but not once the box is cleared
    placeholderData: q.trim() ? keepPreviousData : undefined,
  });

/** Fuzzy feature search for typeahead pickers; see `listFeatures` for browsing. */
export const featureSuggestionsQueryOptions = (q: string) =>
  queryOptions<FeatureSuggestion[]>({
    queryKey: ["featureSuggestions", { q }] as const,
    queryFn: () => listFeatureSuggestionsFn({ data: { q } }),
    enabled: q.trim().length > 0,
  });
