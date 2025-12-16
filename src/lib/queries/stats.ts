import { queryOptions } from "@tanstack/react-query";
import { getSummaryStatsFn } from "../api/stats/getSummaryStatsFn";
import { SummaryStatsDTO } from "../domain/stats/types";

export const summaryStatsQueryOptions = () =>
  queryOptions<SummaryStatsDTO>({
    queryKey: ["summaryStats"],
    queryFn: () => getSummaryStatsFn(),
    staleTime: 60_000,
  });
