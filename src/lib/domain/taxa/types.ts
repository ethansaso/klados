import { taxon, type TaxonRank } from "../../../../db/schema/schema";
import type { PaginatedResult } from "../../validation/pagination";
import type { MediaDTO } from "../media/types";
import type { NameItem } from "../taxon-names/validation";

export type LeanTaxonDTO = {
  id: number;
  rank: TaxonRank;
  acceptedName: string;
};

export type TaxonRow = typeof taxon.$inferSelect;
export type TaxonDTO = Pick<
  TaxonRow,
  | "id"
  | "parentId"
  | "rank"
  | "sourceGbifId"
  | "sourceInatId"
  | "status"
  | "notes"
> & {
  acceptedName: string;
  preferredCommonName: string | null;
  activeChildCount: number;
  media: MediaDTO[];
};

/** Reduced taxon representation used internally for keygen, etc. */
export type TaxonHierarchyDTO = {
  id: number;
  acceptedName: string;
  rank: TaxonRank;
  subtaxonIds: number[];
};

export type TaxonDetailDTO = TaxonDTO & {
  /* Full lineage of ancestors in descending order. */
  ancestors: TaxonDTO[];
  names: NameItem[];
  /* Direct children (subtaxa) with IDs, ranks, and accepted scientific names. */
  subtaxa: LeanTaxonDTO[];
};

export type TaxonPaginatedResult = PaginatedResult<TaxonDTO>;
