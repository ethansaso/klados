import { queryOptions } from "@tanstack/react-query";
import { listSourcesFn } from "../api/sources/listSourcesFn";
import { SourceFilters } from "../domain/sources/search";
import { SourcePaginatedResult } from "../domain/sources/types";

export const sourcesQueryOptions = (
  page: number,
  pageSize: number,
  filters?: SourceFilters
) =>
  queryOptions({
    queryKey: ["sources", { page, pageSize, ...filters }],
    queryFn: () =>
      listSourcesFn({
        data: {
          page,
          pageSize,
          q: filters?.q,
          orderBy: filters?.orderBy,
          orderDir: filters?.orderDir,
        },
      }) as Promise<SourcePaginatedResult>,
    staleTime: 60_000,
  });
