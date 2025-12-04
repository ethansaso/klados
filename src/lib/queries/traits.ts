import { queryOptions } from "@tanstack/react-query";
import { getTraitSetFn } from "../api/traits/getTraitSet";
import { listTraitSetsFn } from "../api/traits/listTraitSets";
import { listValuesForTraitSetFn } from "../api/traits/listTraitSetValues";
import {
  TraitSetDetailDTO,
  TraitSetPaginatedResult,
  TraitValueDTO,
} from "../domain/traits/types";

export const traitSetsQueryOptions = (
  page: number,
  pageSize: number,
  opts?: { q?: string }
) =>
  queryOptions({
    queryKey: ["traitSets", { page, pageSize, q: opts?.q ?? null }] as const,
    queryFn: () =>
      listTraitSetsFn({
        data: { page, pageSize: pageSize, q: opts?.q },
      }) as Promise<TraitSetPaginatedResult>,
    staleTime: 60_000,
  });

export const traitSetQueryOptions = (id: number) =>
  queryOptions({
    queryKey: ["traitSetByKey", id] as const,
    queryFn: () =>
      getTraitSetFn({ data: { id } }) as Promise<TraitSetDetailDTO>,
    staleTime: 60_000,
  });

export const traitSetValuesQueryOptions = (setId: number) =>
  queryOptions({
    queryKey: ["traitSetValues", setId] as const,
    queryFn: () =>
      listValuesForTraitSetFn({ data: { set_id: setId } }) as Promise<
        TraitValueDTO[]
      >,
    staleTime: 30_000,
  });
