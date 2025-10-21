import { queryOptions } from "@tanstack/react-query";
import { getTaxon, listTaxa, TaxonPageResult } from "../serverFns/taxa";

export const taxonQueryOptions = (id: number) =>
  queryOptions({
    queryKey: ["taxa", id],
    queryFn: () => getTaxon({ data: { id } }),
  });

export const taxaQueryOptions = (page: number, pageSize: number, q?: string) =>
  queryOptions({
    queryKey: ["taxa", { page, pageSize, q: q ?? null }] as const,
    queryFn: () =>
      listTaxa({ data: { page, pageSize, q } }) as Promise<TaxonPageResult>,
  });
