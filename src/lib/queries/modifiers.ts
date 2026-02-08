import { queryOptions } from "@tanstack/react-query";
import { getModifierGroupFn } from "../api/modifiers/getModifierGroupFn";
import { listModifierGroupsFn } from "../api/modifiers/listModifierGroupsFn";
import type {
  ModifierGroupDetailDTO,
  ModifierGroupPaginatedResult,
} from "../domain/modifiers/types";

export const modifierGroupsQueryOptions = (
  page: number,
  pageSize: number,
  opts?: { q?: string },
) =>
  queryOptions({
    queryKey: [
      "modifierGroups",
      { page, pageSize, q: opts?.q ?? null },
    ] as const,
    queryFn: () =>
      listModifierGroupsFn({
        data: { page, pageSize: pageSize, q: opts?.q },
      }) as Promise<ModifierGroupPaginatedResult>,
    staleTime: 60_000,
  });

export const modifierGroupQueryOptions = (id: number) =>
  queryOptions({
    queryKey: ["modifierGroup", id] as const,
    queryFn: () =>
      getModifierGroupFn({
        data: { id },
      }) as Promise<ModifierGroupDetailDTO>,
    staleTime: 60_000,
  });
