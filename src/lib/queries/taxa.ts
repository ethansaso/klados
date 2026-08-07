import { queryOptions } from "@tanstack/react-query";
import {
  DEFAULT_TAXON_STATUSES,
  type TaxonFilterInput,
} from "../domain/taxa/search";
import type { TaxonPaginatedResult } from "../domain/taxa/types";
import { getTaxonFn } from "../server-fns/taxa/getTaxonFn";
import { listTaxaFn } from "../server-fns/taxa/listTaxaFn";

export const taxonQueryOptions = (id: number) =>
  queryOptions({
    queryKey: ["taxa", id],
    queryFn: () => getTaxonFn({ data: { id } }),
  });

export const taxaQueryOptions = (
  page: number,
  pageSize: number,
  filters?: TaxonFilterInput,
) => {
  const status = filters?.status ?? DEFAULT_TAXON_STATUSES;
  const statuses = Array.isArray(status) ? status : [status];

  const feature = filters?.features ?? [];
  const features = Array.isArray(feature) ? feature : [feature];

  const characters = filters?.characters ?? [];

  return queryOptions({
    queryKey: [
      "taxa",
      {
        page,
        pageSize,
        q: filters?.q ?? null,
        status: [...statuses].sort(),
        highRank: filters?.highRank ?? null,
        lowRank: filters?.lowRank ?? null,
        hasMedia: filters?.hasMedia ?? null,
        hasMorphology: filters?.hasMorphology ?? null,
        hasEcology: filters?.hasEcology ?? null,
        features: [...features].sort((a, b) => a - b),
        characters: [...characters].map((c) => JSON.stringify(c)).sort(),
      },
    ] as const,
    queryFn: () =>
      listTaxaFn({
        data: {
          page,
          pageSize,
          q: filters?.q,
          status: statuses,
          highRank: filters?.highRank,
          lowRank: filters?.lowRank,
          hasMedia: filters?.hasMedia,
          hasMorphology: filters?.hasMorphology,
          hasEcology: filters?.hasEcology,
          features,
          characters,
        },
      }) as Promise<TaxonPaginatedResult>,
  });
};
