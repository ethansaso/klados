import { queryOptions } from "@tanstack/react-query";
import type {
  SynonymCandidateDTO,
  TraitValueDTO,
  TraitValuePaginatedResult,
} from "../domain/traits/types";
import { getTraitValueFn } from "../server-fns/traits/getTraitValueFn";
import { listSynonymCandidatesFn } from "../server-fns/traits/listSynonymCandidatesFn";
import { listTraitValuesFn } from "../server-fns/traits/listTraitValuesFn";

export const traitValuesQueryOptions = (
  characterId: number,
  page: number,
  pageSize: number,
  opts?: { q?: string },
) =>
  queryOptions<TraitValuePaginatedResult>({
    queryKey: [
      "traitValues",
      {
        characterId,
        page,
        pageSize,
        q: opts?.q ?? null,
      },
    ],
    queryFn: () =>
      listTraitValuesFn({
        data: { characterId, page, pageSize, ...opts },
      }),
  });

export const traitValueQueryOptions = (id: number) =>
  queryOptions<TraitValueDTO>({
    queryKey: ["traitValues", id] as const,
    queryFn: () => getTraitValueFn({ data: { id } }),
  });

export const synonymCandidatesQueryOptions = (
  characterId: number,
  q: string,
  opts?: { excludeTraitId?: number; limit?: number },
) => {
  const limit = opts?.limit ?? 20;
  const excludeTraitId = opts?.excludeTraitId;

  return queryOptions<SynonymCandidateDTO[]>({
    queryKey: [
      "synonymCandidates",
      { characterId, excludeTraitId: excludeTraitId ?? null, q, limit },
    ] as const,
    queryFn: () =>
      listSynonymCandidatesFn({
        data: { characterId, excludeTraitId, q: q || undefined, limit },
      }),
  });
};
