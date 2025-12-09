import { listKeysQuery } from "./repo";
import { KeyPaginatedResult } from "./types";

export async function listKeys(args: {
  q?: string;
  page: number;
  pageSize: number;
}): Promise<KeyPaginatedResult> {
  return listKeysQuery(args);
}
