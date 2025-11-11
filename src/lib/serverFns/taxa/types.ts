import { taxon } from "../../../db/schema/schema";
import { PaginatedResult } from "../../validation/pagination";

export type TaxonRow = typeof taxon.$inferSelect;
export type TaxonDTO = Pick<
  TaxonRow,
  | "id"
  | "parentId"
  | "rank"
  | "sourceGbifId"
  | "sourceInatId"
  | "status"
  | "media"
  | "notes"
> & {
  acceptedName: string;
  activeChildCount: number;
};
export type TaxonDetailDTO = Omit<TaxonDTO, "parentId"> & {
  /* Full lineage of ancestors in descending order. */
  ancestors: TaxonDTO[];
};

export interface TaxonPaginatedResult extends PaginatedResult {
  items: TaxonDTO[];
}
