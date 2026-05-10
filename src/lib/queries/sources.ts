import { queryOptions } from "@tanstack/react-query";
import type { SourceFilters } from "../domain/sources/search";
import type { SourcePaginatedResult } from "../domain/sources/types";
import { listSourcesFn } from "../server-fns/sources/listSourcesFn";

export const sourcesQueryOptions = ({
  page,
  pageSize,
  filters,
}: {
  page: number;
  pageSize: number;
  filters?: SourceFilters;
}) =>
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
