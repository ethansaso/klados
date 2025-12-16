import { createServerFn } from "@tanstack/react-start";
import { getSummaryStats } from "../../domain/stats/service";
import { SummaryStatsDTO } from "../../domain/stats/types";

export const getSummaryStatsFn = createServerFn({ method: "GET" }).handler(
  async (): Promise<SummaryStatsDTO> => {
    return getSummaryStats();
  }
);
