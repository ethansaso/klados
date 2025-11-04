import { queryOptions } from "@tanstack/react-query";
import { getTaxon, listTaxa } from "../serverFns/taxa/fns";
import { TaxonPageResult } from "../serverFns/taxa/types";

export const taxonQueryOptions = (id: number) =>
  queryOptions({
    queryKey: ["taxon", id],
    queryFn: () => getTaxon({ data: { id } }),
  });

export const taxaQueryOptions = (
  page: number,
  pageSize: number,
  opts?: { q?: string; status?: "active" | "draft" | "deprecated" }
) =>
  queryOptions({
    queryKey: [
      "taxa",
      { page, pageSize, q: opts?.q ?? null, status: opts?.status ?? "active" },
    ] as const,
    queryFn: () =>
      listTaxa({
        data: { page, pageSize, q: opts?.q, status: opts?.status },
      }) as Promise<TaxonPageResult>,
  });
