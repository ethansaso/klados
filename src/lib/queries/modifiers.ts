import { queryOptions } from "@tanstack/react-query";
import { listModifierGroupsFn } from "../api/modifiers/listModifierGroupsFn";
import type { ModifierGroupPaginatedResult } from "../domain/modifiers/types";

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
