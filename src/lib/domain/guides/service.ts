import { listGuidesQuery } from "./repo";
import { GuidePaginatedResult } from "./types";

export async function listGuides(args: {
  q?: string;
  page: number;
  pageSize: number;
}): Promise<GuidePaginatedResult> {
  return listGuidesQuery(args);
}
