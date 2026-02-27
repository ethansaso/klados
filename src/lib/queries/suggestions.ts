import { queryOptions } from "@tanstack/react-query";
import { listModifierStateSuggestionsFn } from "../api/character-suggestions/listModifierStateSuggestionsFn";
import type { ModifierSuggestion } from "../domain/suggestions/types";

export const modifierSuggestionsQueryOptions = (q: string) =>
  queryOptions({
    queryKey: ["modifierSuggestions", { q }] as const,
    queryFn: () =>
      listModifierStateSuggestionsFn({ data: { q, limit: 30 } }) as Promise<
        ModifierSuggestion[]
      >,
    staleTime: 5_000,
  });

// TODO: add characterStateSuggestionsQueryOptions (featureId, q) wrapping
// listCharacterStateSuggestionsFn, once CharacterStateSearch is migrated off
// its bespoke useServerFn + useState pattern.
