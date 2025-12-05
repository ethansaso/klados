import { queryOptions } from "@tanstack/react-query";
import { getTaxonFn } from "../api/taxa/getTaxon";
import { listTaxaFn } from "../api/taxa/listTaxa";
import { TaxonFilters } from "../domain/taxa/search";
import { TaxonPaginatedResult } from "../domain/taxa/types";

export const taxonQueryOptions = (id: number) =>
  queryOptions({
    queryKey: ["taxon", id],
    queryFn: () => getTaxonFn({ data: { id } }),
    staleTime: 60_000,
  });

export const taxaQueryOptions = (
  page: number,
  pageSize: number,
  filters?: TaxonFilters
) =>
  queryOptions({
    queryKey: [
      "taxon",
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
