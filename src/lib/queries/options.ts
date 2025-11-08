import { queryOptions } from "@tanstack/react-query";
import {
  getOptionSet,
  listOptionSets,
  listOptionSetValues,
} from "../serverFns/characters/options/fns";
import {
  OptionSetDetailDTO,
  OptionSetPaginatedResult,
  OptionValueDTO,
} from "../serverFns/characters/options/types";

export const optionSetsQueryOptions = (
  page: number,
  pageSize: number,
  opts?: { q?: string }
) =>
  queryOptions({
    queryKey: ["optionSets", { page, pageSize, q: opts?.q ?? null }] as const,
    queryFn: () =>
      listOptionSets({
        data: { page, pageSize, q: opts?.q },
      }) as Promise<OptionSetPaginatedResult>,
    placeholderData: (prev) => prev,
    staleTime: 60_000,
  });

export const optionSetQueryOptions = (id: number) =>
  queryOptions({
    queryKey: ["optionSetByKey", id] as const,
    queryFn: () =>
      getOptionSet({ data: { id } }) as Promise<OptionSetDetailDTO>,
    staleTime: 60_000,
  });

export const optionSetValuesQueryOptions = (setId: number) =>
  queryOptions({
    queryKey: ["optionSetValues", setId] as const,
    queryFn: () =>
      listOptionSetValues({ data: { setId } }) as Promise<OptionValueDTO[]>,
    staleTime: 30_000,
  });
