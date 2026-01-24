import { listModifierGroupsQuery } from "./repo";
import { ModifierGroupPaginatedResult } from "./types";

export async function listModifierGroups(args: {
  page: number;
  pageSize: number;
  q?: string;
}): Promise<ModifierGroupPaginatedResult> {
  return listModifierGroupsQuery(args);
}
