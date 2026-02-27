import { createServerFn } from "@tanstack/react-start";
import z from "zod";
import { searchModifierSuggestions } from "../../domain/suggestions/service";
import type { ModifierSuggestion } from "../../domain/suggestions/types";

/**
 * Search all modifiers for suggestions.
 */
export const listModifierStateSuggestionsFn = createServerFn({ method: "GET" })
  .inputValidator(
    z.object({
      q: z.string().trim(),
      limit: z.number().int().min(1).max(50).optional(),
    }),
  )
  .handler(async ({ data }): Promise<ModifierSuggestion[]> => {
    return searchModifierSuggestions({
      q: data.q,
      limit: data.limit,
    });
  });
