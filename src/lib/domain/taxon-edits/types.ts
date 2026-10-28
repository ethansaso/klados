import type { taxonEdit, TaxonEditKind } from "../../../../db/schema/schema";
import type { PaginatedResult } from "../../validation/pagination";
import type { TaxonDTO } from "../taxa/types";
import type { UserDTO } from "../users/types";

export type TaxonEditRow = typeof taxonEdit.$inferSelect;

export type TaxonEditArea = keyof Pick<
  TaxonEditRow,
  | "names"
  | "taxonomy"
  | "externalIds"
  | "morphology"
  | "media"
  | "sources"
  | "ecology"
  | "notes"
>;
export type TaxonEditAreas = Partial<Record<TaxonEditArea, boolean>>;

export type TaxonCurationDTO = Pick<
  TaxonEditRow,
  "id" | "createdAt" | TaxonEditArea
> & {
  kind: TaxonEditKind;
  /** Null once the account has been deleted. */
  user: UserDTO | null;
};

export type TaxonEditLogDTO = TaxonCurationDTO & { taxon: TaxonDTO };
export type TaxonEditLogPaginatedResult = PaginatedResult<TaxonEditLogDTO>;
