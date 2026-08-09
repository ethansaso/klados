import { queryOptions } from "@tanstack/react-query";
import type {
  FeatureDetailDTO,
  FeaturePaginatedResult,
} from "../domain/features/types";
import { getFeatureFn } from "../server-fns/features/getFeatureFn";
import { listFeaturesFn } from "../server-fns/features/listFeaturesFn";

export const featuresQueryOptions = (
  page: number,
  pageSize: number,
  opts?: { q?: string; ids?: number[] },
) =>
  queryOptions<FeaturePaginatedResult>({
    queryKey: [
      "features",
      {
        page,
        pageSize,
        q: opts?.q ?? null,
        ids: opts?.ids ? [...opts.ids].sort((a, b) => a - b) : null,
      },
    ],
    queryFn: () => listFeaturesFn({ data: { page, pageSize, ...opts } }),
  });

export const featureQueryOptions = (id: number) =>
  queryOptions({
    queryKey: ["features", id] as const,
    queryFn: () => getFeatureFn({ data: { id } }) as Promise<FeatureDetailDTO>,
  });
