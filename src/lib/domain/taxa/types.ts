import { taxon, TaxonRank } from "../../../db/schema/schema";
import { PaginatedResult } from "../../validation/pagination";
import { NameItem } from "../taxon-names/validation";

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
  | "media"
  | "notes"
> & {
  acceptedName: string;
  preferredCommonName: string | null;
  activeChildCount: number;
};

export type TaxonHierarchyDTO = {
  id: number;
  acceptedName: string;
  rank: TaxonRank;
  subtaxonIds: number[];
};

export type TaxonDetailDTO = Omit<TaxonDTO, "parentId"> & {
  /* Full lineage of ancestors in descending order. */
  ancestors: TaxonDTO[];
  names: NameItem[];
  /* Direct children (subtaxa) with IDs, ranks, and accepted scientific names. */
  subtaxa: LeanTaxonDTO[];
};

export type TaxonPaginatedResult = PaginatedResult<TaxonDTO>;
