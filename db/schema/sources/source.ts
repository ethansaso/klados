import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  pgTable,
  serial,
  text,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { withTimestamps } from "../../utils/timestamps";

/**
 * A reusable reference / source (book, paper, website, dataset landing page, etc.).
 */
export const source = pgTable(
  "source",
  withTimestamps({
    id: serial("id").primaryKey(),

    // Required for reasonable citation
    name: text("name").notNull(),
    authors: text("authors").notNull().default(""),
    publisher: text("publisher").notNull().default(""),

    // Optional fields for different source types
    isbn: text("isbn"),
    url: text("url"),
    /** Nullable year provision; no need to overcomplicate */
    publicationYear: integer("publication_year"),

    // General notes about what this source is useful for.
    note: text("note").notNull().default(""),
  }),
  (t) => [
    // Sanity checks
    check("source_name_not_empty", sql`btrim(${t.name}) <> ''`),
    check(
      "source_publication_year_sane",
      sql`${t.publicationYear} IS NULL OR (${t.publicationYear} >= 1400 AND ${t.publicationYear} <= 2500)`
    ),

    // Reasonable avoidance of duplicates
    uniqueIndex("source_isbn_uq")
      .on(t.isbn)
      .where(sql`${t.isbn} IS NOT NULL`),
    uniqueIndex("source_url_uq")
      .on(t.url)
      .where(sql`${t.url} IS NOT NULL`),

    // Fast indexes for searching/sorting
    index("source_pub_year_idx").on(t.publicationYear),
    index("source_name_trgm_lower_idx").using(
      "gin",
      sql`lower(${t.name}) gin_trgm_ops`
    ),
    index("source_authors_trgm_lower_idx").using(
      "gin",
      sql`lower(${t.authors}) gin_trgm_ops`
    ),
  ]
);
