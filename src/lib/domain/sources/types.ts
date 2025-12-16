import { source } from "../../../db/schema/sources/source";
import { PaginatedResult } from "../../validation/pagination";

export type SourceRow = typeof source.$inferSelect;
export type SourceDTO = Pick<
  SourceRow,
  | "id"
  | "name"
  | "authors"
  | "publisher"
  | "note"
  | "isbn"
  | "url"
  | "publicationYear"
>;

export type SourcePaginatedResult = PaginatedResult<SourceDTO>;
