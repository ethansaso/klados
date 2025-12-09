import { queryOptions } from "@tanstack/react-query";
import { getKeyFn } from "../api/keys/getKey";
import { listKeysFn } from "../api/keys/listKeys";
import { KeyPaginatedResult } from "../domain/keys/types";

export function keyQueryOptions(id: number) {
  return queryOptions({
    queryKey: ["key", id],
    queryFn: async () => {
      return getKeyFn({ data: { id } });
    },
    staleTime: 60_000,
  });
}

export const keysQueryOptions = (
  page: number,
  pageSize: number,
  opts?: { q?: string }
) =>
  queryOptions<KeyPaginatedResult>({
    queryKey: ["keys", { page, pageSize, q: opts?.q ?? null }],
    queryFn: () => listKeysFn({ data: { page, pageSize: pageSize, ...opts } }),
    staleTime: 60_000,
  });
