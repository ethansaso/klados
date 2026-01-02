import { queryOptions } from "@tanstack/react-query";
import { getTraitSetFn } from "../api/traits/getTraitSetFn";
import { getTraitSetValuesFn } from "../api/traits/getTraitSetValuesFn";
import { listTraitSetsFn } from "../api/traits/listTraitSetsFn";
import { listTraitSetValuesFn } from "../api/traits/listTraitSetValuesFn";
import {
  TraitSetDetailDTO,
  TraitSetPaginatedResult,
  TraitValueDTO,
  TraitValuePaginatedResult,
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
      getTraitSetValuesFn({ data: { setId } }) as Promise<TraitValueDTO[]>,
    staleTime: 30_000,
  });

export const traitSetValuesPaginatedQueryOptions = (
  setId: number,
  page: number,
  pageSize: number,
  opts?: { q?: string; kind?: "canonical" | "alias" }
) =>
  queryOptions({
    queryKey: [
      "traitSetValuesPaginated",
      {
        setId,
        page,
        pageSize,
        kind: opts?.kind ?? null,
        q: opts?.q ?? null,
      },
    ] as const,
    queryFn: () =>
      listTraitSetValuesFn({
        data: { setId, page, pageSize, kind: opts?.kind, q: opts?.q },
      }) as Promise<TraitValuePaginatedResult>,
    staleTime: 30_000,
  });
