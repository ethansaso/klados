import { createServerFn } from "@tanstack/react-start";
import z from "zod";

import { parseNumericQuery } from "./numericParsing";
import {
  buildNumericRangeSuggestions,
  buildNumericSingleSuggestions,
  searchCategoricalSuggestions,
} from "./suggestions";
import type { TraitSuggestion } from "./types";

/**
 * Search for trait suggestions (categorical values + numeric single/range)
 * scoped to a particular character group.
 */
export const searchGroupTraitSuggestionsFn = createServerFn({ method: "GET" })
  .inputValidator(
    z.object({
      groupId: z.number().int().nonnegative(),
      q: z.string().trim(),
      limit: z.number().int().min(1).max(50).optional(),
    }),
  )
  .handler(async ({ data }): Promise<TraitSuggestion[]> => {
    const { groupId, q } = data;
    const limit = data.limit ?? 20;

    const parsedNumeric = parseNumericQuery(q);
    const isNumericQuery =
      parsedNumeric.kind === "single" || parsedNumeric.kind === "range";

    const categoricalPromise = searchCategoricalSuggestions({
      groupId,
      q,
      limit,
    });

    const numericSinglePromise = isNumericQuery
      ? buildNumericSingleSuggestions({ groupId, parsedNumeric, limit })
      : Promise.resolve([]);

    const numericRangePromise = isNumericQuery
      ? buildNumericRangeSuggestions({ groupId, parsedNumeric, limit })
      : Promise.resolve([]);

    const [categorical, numericSingle, numericRange] = await Promise.all([
      categoricalPromise,
      numericSinglePromise,
      numericRangePromise,
    ]);

    const merged: TraitSuggestion[] = isNumericQuery
      ? [...numericSingle, ...numericRange, ...categorical]
      : [...categorical];

    return merged.slice(0, limit);
  });
