import { taxonSource } from "../../../../db/schema/sources/taxonSource";
import type { PaginatedResult } from "../../validation/pagination";
import type { SourceDTO } from "../sources/types";

export type TaxonSourceRow = typeof taxonSource.$inferSelect;
export type TaxonSourceDTO = Pick<
  TaxonSourceRow,
  "id" | "taxonId" | "sourceId" | "accessedAt" | "locator" | "note"
> & {
  source: SourceDTO;
};

export type TaxonSourcePaginatedResult = PaginatedResult<TaxonSourceDTO>;
