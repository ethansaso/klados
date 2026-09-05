import { queryOptions } from "@tanstack/react-query";
import type {
  ModifierDTO,
  ModifierGroupDetailDTO,
  ModifierGroupPaginatedResult,
  ModifierPaginatedResult,
} from "../domain/modifiers/types";
import { getModifierFn } from "../server-fns/modifiers/getModifierFn";
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
  opts?: { q?: string; excludeId?: number },
) =>
  queryOptions({
    queryKey: [
      "modifiers",
      groupId,
      {
        page,
        pageSize,
        q: opts?.q ?? null,
        excludeId: opts?.excludeId ?? null,
      },
    ] as const,
    queryFn: () =>
      listModifiersFn({
        data: {
          groupId,
          page,
          pageSize,
          q: opts?.q,
          excludeId: opts?.excludeId,
        },
      }) as Promise<ModifierPaginatedResult>,
  });

export const modifierQueryOptions = (id: number) =>
  queryOptions({
    queryKey: ["modifier", id] as const,
    queryFn: () => getModifierFn({ data: { id } }) as Promise<ModifierDTO>,
  });
