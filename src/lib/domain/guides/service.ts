import { listGuidesQuery } from "./repo";
import type { GuidePaginatedResult } from "./types";

export async function listGuides(args: {
  q?: string;
  page: number;
  pageSize: number;
}): Promise<GuidePaginatedResult> {
  return listGuidesQuery(args);
}
