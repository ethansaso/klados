import type { PaginationParams } from "../../validation/pagination";
import { selectTaxonEditLogPage } from "./repo";
import type { TaxonEditLogPaginatedResult } from "./types";

export async function getTaxonEditLogPage(
  params: PaginationParams,
): Promise<TaxonEditLogPaginatedResult> {
  return selectTaxonEditLogPage(params);
}
