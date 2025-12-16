import { PgColumn } from "drizzle-orm/pg-core";
import { source as sourceTbl } from "../../../db/schema/sources/source";
import { SourceDTO } from "./types";

export const sourceSelectDto = {
  id: sourceTbl.id,
  name: sourceTbl.name,
  authors: sourceTbl.authors,
  publisher: sourceTbl.publisher,
  note: sourceTbl.note,
  isbn: sourceTbl.isbn,
  url: sourceTbl.url,
  publicationYear: sourceTbl.publicationYear,
} satisfies Record<keyof SourceDTO, PgColumn>;
