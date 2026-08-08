import { createServerFn } from "@tanstack/react-start";
import z from "zod";

import { searchFeatureSuggestions } from "../../domain/suggestions/service";
import type { FeatureSuggestion } from "../../domain/suggestions/types";

/**
 * Fuzzy feature search for typeahead pickers.
 *
 * Separate from listFeaturesFn, which stays an exact substring match for the
 * glossary's own browsing and editing.
 */
export const listFeatureSuggestionsFn = createServerFn({ method: "GET" })
  .validator(
    z.object({
      q: z.string().trim(),
      limit: z.number().int().min(1).max(50).optional(),
    }),
  )
  .handler(async ({ data }): Promise<FeatureSuggestion[]> => {
    return searchFeatureSuggestions(data);
  });
