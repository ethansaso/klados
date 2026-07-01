import { queryOptions } from "@tanstack/react-query";
import type { TaxonFilters } from "../domain/taxa/search";
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
  filters?: TaxonFilters,
) =>
  queryOptions({
    queryKey: [
      "taxa",
      {
        page,
        pageSize,
        q: filters?.q ?? null,
        status: filters?.status ?? "active",
        highRank: filters?.highRank ?? null,
        lowRank: filters?.lowRank ?? null,
        hasMedia: filters?.hasMedia ?? null,
      },
    ] as const,
    queryFn: () =>
      listTaxaFn({
        data: {
          page,
          pageSize,
          q: filters?.q,
          status: filters?.status,
          highRank: filters?.highRank,
          lowRank: filters?.lowRank,
          hasMedia: filters?.hasMedia,
        },
      }) as Promise<TaxonPaginatedResult>,
  });
