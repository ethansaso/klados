import { queryOptions } from "@tanstack/react-query";
import type { TraitValuePaginatedResult } from "../domain/traits/types";
import { listTraitValuesFn } from "../server-fns/traits/listTraitValuesFn";

export const traitValuesQueryOptions = (
  characterId: number,
  page: number,
  pageSize: number,
  opts?: { canonicalOnly?: boolean; q?: string },
) =>
  queryOptions<TraitValuePaginatedResult>({
    queryKey: [
      "traitValues",
      {
        characterId,
        page,
        pageSize,
        canonicalOnly: opts?.canonicalOnly ?? null,
        q: opts?.q ?? null,
      },
    ],
    queryFn: () =>
      listTraitValuesFn({
        data: { characterId, page, pageSize, ...opts },
      }),
    staleTime: 60_000,
  });
