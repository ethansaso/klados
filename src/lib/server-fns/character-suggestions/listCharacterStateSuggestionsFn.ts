import { createServerFn } from "@tanstack/react-start";
import z from "zod";

import { searchCharacterStateSuggestions } from "../../domain/suggestions/service";
import type { TraitSuggestion } from "../../domain/suggestions/types";

/**
 * Search for state suggestions (categorical values + numeric single/range)
 * scoped to a particular feature.
 */
export const listCharacterStateSuggestionsFn = createServerFn({ method: "GET" })
  .validator(
    z.object({
      featureId: z.number().int().nonnegative(),
      q: z.string().trim(),
      limit: z.number().int().min(1).max(50).optional(),
    }),
  )
  .handler(async ({ data }): Promise<TraitSuggestion[]> => {
    return searchCharacterStateSuggestions({
      featureId: data.featureId,
      q: data.q,
      limit: data.limit,
    });
  });
