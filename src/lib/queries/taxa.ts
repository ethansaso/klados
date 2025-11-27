import { queryOptions } from "@tanstack/react-query";
import { getTaxonFn } from "../api/taxa/getTaxon";
import { listTaxaFn } from "../api/taxa/listTaxa";
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
  opts?: { q?: string; status?: "active" | "draft" | "deprecated" }
) =>
  queryOptions({
    queryKey: [
      "taxon",
      { page, pageSize, q: opts?.q ?? null, status: opts?.status ?? "active" },
    ] as const,
    queryFn: () =>
      listTaxaFn({
        data: { page, pageSize: pageSize, q: opts?.q, status: opts?.status },
      }) as Promise<TaxonPaginatedResult>,
  });
