import { queryOptions } from "@tanstack/react-query";
import type {
  ModifierGroupDetailDTO,
  ModifierGroupPaginatedResult,
  ModifierPaginatedResult,
} from "../domain/modifiers/types";
import { getModifierGroupFn } from "../server-fns/modifiers/getModifierGroupFn";
import { listModifierGroupsFn } from "../server-fns/modifiers/listModifierGroupsFn";
import { listModifiersFn } from "../server-fns/modifiers/listModifiersFn";

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
        data: { page, pageSize, q: opts?.q },
      }) as Promise<ModifierGroupPaginatedResult>,
  });

export const modifierGroupQueryOptions = (id: number) =>
  queryOptions({
    queryKey: ["modifierGroup", id] as const,
    queryFn: () =>
      getModifierGroupFn({
        data: { id },
      }) as Promise<ModifierGroupDetailDTO>,
  });

export const modifiersQueryOptions = (
  groupId: number,
  page: number,
  pageSize: number,
  opts?: { q?: string },
) =>
  queryOptions({
    queryKey: [
      "modifiers",
      groupId,
      { page, pageSize, q: opts?.q ?? null },
    ] as const,
    queryFn: () =>
      listModifiersFn({
        data: { groupId, page, pageSize, q: opts?.q },
      }) as Promise<ModifierPaginatedResult>,
  });
