import { createServerFn } from "@tanstack/react-start";
import z from "zod";

import { resolveFilterChips } from "../../domain/filter-chips/service";
import type { FilterChip } from "../../domain/filter-chips/types";
import { TaxonFilterTokensSchema } from "../../domain/taxa/search";

/** Resolve character filter tokens into chip labels. */
export const resolveFilterChipsFn = createServerFn({ method: "GET" })
  .validator(z.object({ tokens: TaxonFilterTokensSchema }))
  .handler(async ({ data }): Promise<FilterChip[]> => {
    return resolveFilterChips(data.tokens);
  });
