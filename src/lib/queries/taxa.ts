import { queryOptions } from "@tanstack/react-query";
import { getTaxon } from "../api/taxa/fns/get";
import { listTaxa } from "../api/taxa/fns/list";
import { TaxonPaginatedResult } from "../api/taxa/types";

export const taxonQueryOptions = (id: number) =>
  queryOptions({
    queryKey: ["taxon", id],
    queryFn: () => getTaxon({ data: { id } }),
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
      listTaxa({
        data: { page, pageSize: pageSize, q: opts?.q, status: opts?.status },
      }) as Promise<TaxonPaginatedResult>,
  });
