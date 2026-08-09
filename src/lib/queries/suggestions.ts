import { queryOptions } from "@tanstack/react-query";
import type {
  FeatureSuggestion,
  ModifierSuggestion,
  TraitSuggestion,
} from "../domain/suggestions/types";
import { listCharacterStateFilterSuggestionsFn } from "../server-fns/suggestions/listCharacterStateFilterSuggestionsFn";
import { listFeatureSuggestionsFn } from "../server-fns/suggestions/listFeatureSuggestionsFn";
import { listModifierStateSuggestionsFn } from "../server-fns/suggestions/listModifierStateSuggestionsFn";

// TODO: add characterStateSuggestionsQueryOptions (featureId, q) wrapping
// listCharacterStateSuggestionsFn, once CharacterStateSearch is migrated off
// its bespoke useServerFn + useState pattern.

export const modifierSuggestionsQueryOptions = (q: string) =>
  queryOptions({
    queryKey: ["modifierSuggestions", { q }] as const,
    queryFn: () =>
      listModifierStateSuggestionsFn({ data: { q, limit: 30 } }) as Promise<
        ModifierSuggestion[]
      >,
    staleTime: 5_000,
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

/** Fuzzy feature search for typeahead pickers; see `listFeatures` for browsing. */
export const featureSuggestionsQueryOptions = (q: string) =>
  queryOptions<FeatureSuggestion[]>({
    queryKey: ["featureSuggestions", { q }] as const,
    queryFn: () => listFeatureSuggestionsFn({ data: { q } }),
    enabled: q.trim().length > 0,
  });
