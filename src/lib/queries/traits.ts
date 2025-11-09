import { queryOptions } from "@tanstack/react-query";
import {
  getTraitSet,
  listTraitSetValues,
  listTraitSets,
} from "../serverFns/characters/traits/fns";
import {
  TraitSetDetailDTO,
  TraitSetPaginatedResult,
  TraitValueDTO,
} from "../serverFns/characters/traits/types";

export const traitSetsQueryOptions = (
  page: number,
  pageSize: number,
  opts?: { q?: string }
) =>
  queryOptions({
    queryKey: ["traitSets", { page, pageSize, q: opts?.q ?? null }] as const,
    queryFn: () =>
      listTraitSets({
        data: { page, pageSize, q: opts?.q },
      }) as Promise<TraitSetPaginatedResult>,
    staleTime: 60_000,
  });

export const traitSetQueryOptions = (id: number) =>
  queryOptions({
    queryKey: ["traitSetByKey", id] as const,
    queryFn: () => getTraitSet({ data: { id } }) as Promise<TraitSetDetailDTO>,
    staleTime: 60_000,
  });

export const traitSetValuesQueryOptions = (setId: number) =>
  queryOptions({
    queryKey: ["traitSetValues", setId] as const,
    queryFn: () =>
      listTraitSetValues({ data: { setId } }) as Promise<TraitValueDTO[]>,
    staleTime: 30_000,
  });
