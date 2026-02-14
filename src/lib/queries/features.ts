import { queryOptions } from "@tanstack/react-query";
import { getFeatureFn } from "../api/features/getFeatureFn";
import { listFeaturesFn } from "../api/features/listFeaturesFn";
import type {
  FeatureDetailDTO,
  FeaturePaginatedResult,
} from "../domain/features/types";

export const featuresQueryOptions = (
  page: number,
  pageSize: number,
  opts?: { q?: string },
) =>
  queryOptions<FeaturePaginatedResult>({
    queryKey: ["features", { page, pageSize, q: opts?.q ?? null }],
    queryFn: () => listFeaturesFn({ data: { page, pageSize, ...opts } }),
    staleTime: 60_000,
  });

export const featureQueryOptions = (id: number) =>
  queryOptions({
    queryKey: ["feature", id] as const,
    queryFn: () => getFeatureFn({ data: { id } }) as Promise<FeatureDetailDTO>,
    staleTime: 60_000,
  });
