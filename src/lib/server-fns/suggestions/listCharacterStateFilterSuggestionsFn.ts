import { createServerFn } from "@tanstack/react-start";
import z from "zod";

import { searchCharacterStateFilterSuggestions } from "../../domain/suggestions/service";
import type { TraitSuggestion } from "../../domain/suggestions/types";

/**
 * Search state suggestions for the taxa filters.
 *
 * Uses slightly different semantics from listCharacterStateSuggestionsFn;
 * feature scope is optional, and numeric characters yield single values rather than ranges.
 * (expectation is users will want to ask 'what mushroom has a 5cm cap' and find taxa with e.g. 3-11 cm)
 */
export const listCharacterStateFilterSuggestionsFn = createServerFn({
  method: "GET",
})
  .validator(
    z.object({
      featureId: z.number().int().positive().optional(),
      q: z.string().trim(),
      limit: z.number().int().min(1).max(50).optional(),
    }),
  )
  .handler(async ({ data }): Promise<TraitSuggestion[]> => {
    return searchCharacterStateFilterSuggestions(data);
  });
