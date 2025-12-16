import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { withTimestamps } from "../../utils/timestamps";
import { taxon } from "../schema";
import { source } from "./source";

/**
 * Per-taxon citation of a source.
 */
export const taxonSource = pgTable(
  "taxon_source",
  withTimestamps({
    id: serial("id").primaryKey(),

    taxonId: integer("taxon_id")
      .notNull()
      .references(() => taxon.id, { onDelete: "cascade" }),

    sourceId: integer("source_id")
      .notNull()
      .references(() => source.id, { onDelete: "restrict" }),

    accessedAt: timestamp("accessed_at", { withTimezone: true })
      .notNull()
      .defaultNow(),

    /** "Vol 1 p. 312-330", "Fig. 2", "Couplet 7", etc. */
    locator: text("locator").notNull().default(""),

    note: text("note").notNull().default(""),
  }),
  (t) => [
    // One link per (taxon, source)
    uniqueIndex("taxon_source_uq").on(t.taxonId, t.sourceId),

    // fast joins
    index("taxon_source_taxon_idx").on(t.taxonId),
    index("taxon_source_source_idx").on(t.sourceId),
    index("taxon_source_accessed_at_idx").on(t.accessedAt),

    // reject whitespace-only locators
    check(
      "taxon_source_locator_trimmed_ck",
      sql`${t.locator} = '' OR btrim(${t.locator}) <> ''`
    ),
  ]
);
