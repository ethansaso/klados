import { queryOptions } from "@tanstack/react-query";
import type { GuidePaginatedResult } from "../domain/guides/types";
import { getGuideFn } from "../server-fns/guides/getGuideFn";
import { listGuidesFn } from "../server-fns/guides/listGuidesFn";

export function guideQueryOptions(id: number) {
  return queryOptions({
    queryKey: ["guides", id],
    queryFn: async () => {
      return getGuideFn({ data: { id } });
    },
  });
}

export const guidesQueryOptions = (
  page: number,
  pageSize: number,
  opts?: { q?: string },
) =>
  queryOptions<GuidePaginatedResult>({
    queryKey: ["guides", { page, pageSize, q: opts?.q ?? null }],
    queryFn: () => listGuidesFn({ data: { page, pageSize, ...opts } }),
  });
