import { createServerFn } from "@tanstack/react-start";
import z from "zod";

import { resolveCharacterFilterChips } from "../../domain/filter-chips/service";
import type { CharacterFilterChip } from "../../domain/filter-chips/types";
import { TaxonCharacterFilterSchema } from "../../domain/taxa/search";

/** Resolve character filter tokens into chip labels. */
export const resolveCharacterFilterChipsFn = createServerFn({ method: "GET" })
  .validator(z.object({ tokens: TaxonCharacterFilterSchema }))
  .handler(async ({ data }): Promise<CharacterFilterChip[]> => {
    return resolveCharacterFilterChips(data.tokens);
  });
