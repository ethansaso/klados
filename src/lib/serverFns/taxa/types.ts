import { taxa } from "../../../db/schema/schema";
import { PaginatedResult } from "../returnTypes";

export type TaxonRow = typeof taxa.$inferSelect;
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
};

export interface TaxonPageResult extends PaginatedResult {
  items: TaxonDTO[];
}
