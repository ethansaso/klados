import { queryOptions } from "@tanstack/react-query";
import type { MediaPaginatedResult } from "../domain/media/types";
import { listMediaFn } from "../server-fns/media/listMediaFn";

export const mediaQueryOptions = (
  page: number,
  pageSize: number,
  opts?: { q?: string },
) =>
  queryOptions<MediaPaginatedResult>({
    queryKey: ["media", { page, pageSize, q: opts?.q ?? null }],
    queryFn: () => listMediaFn({ data: { page, pageSize, ...opts } }),
  });
