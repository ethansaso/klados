import { queryOptions } from "@tanstack/react-query";
import { getGuideFn } from "../api/guides/getGuide";
import { listGuidesFn } from "../api/guides/listGuides";
import { GuidePaginatedResult } from "../domain/guides/types";

export function guideQueryOptions(id: number) {
  return queryOptions({
    queryKey: ["guide", id],
    queryFn: async () => {
      return getGuideFn({ data: { id } });
    },
    staleTime: 60_000,
  });
}

export const guidesQueryOptions = (
  page: number,
  pageSize: number,
  opts?: { q?: string }
) =>
  queryOptions<GuidePaginatedResult>({
    queryKey: ["guides", { page, pageSize, q: opts?.q ?? null }],
    queryFn: () =>
      listGuidesFn({ data: { page, pageSize: pageSize, ...opts } }),
    staleTime: 60_000,
  });
