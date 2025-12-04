import { fetchSummaryStats } from "./repo";
import type { SummaryStatsDTO } from "./types";

export async function getSummaryStats(): Promise<SummaryStatsDTO> {
  return fetchSummaryStats();
}
