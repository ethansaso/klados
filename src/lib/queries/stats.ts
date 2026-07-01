import { queryOptions } from "@tanstack/react-query";
import type { SummaryStatsDTO } from "../domain/stats/types";
import { getSummaryStatsFn } from "../server-fns/stats/getSummaryStatsFn";

export const summaryStatsQueryOptions = () =>
  queryOptions<SummaryStatsDTO>({
    queryKey: ["summaryStats"],
    queryFn: () => getSummaryStatsFn(),
  });
