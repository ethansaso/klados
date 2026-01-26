import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  pgTable,
  serial,
  text,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";
import { withTimestamps } from "../../utils/timestamps";
import { taxon } from "./taxon";

export const taxonName = pgTable(
  "taxon_name",
  withTimestamps({
    id: serial("id").primaryKey(),
    taxonId: integer("taxon_id")
      .notNull()
      .references(() => taxon.id, { onDelete: "cascade" }),
    /** BCP-47 like "en" / "en-US"; scientific uses "sci" */
    locale: varchar("locale", { length: 16 }).notNull(),
    value: text("value").notNull(),
    /**
     * Represents "accepted name" for scientific names, "preferred" for common.
     */
    isPreferred: boolean("is_preferred").notNull().default(false),
  }),
  (t) => [
    // Fast filters
    index("names_taxon_idx").on(t.taxonId),
    index("names_taxon_locale_idx").on(t.taxonId, t.locale),

    // Fast for fetching accepted scientific name
    index("names_sci_accepted_idx")
      .on(t.taxonId)
      .where(sql`${t.locale} = 'sci' AND ${t.isPreferred} = true`),

    // Trigram GIN index for searching names w/ ILIKE
    index("names_value_trgm_lower_idx").using(
      "gin",
      sql`lower(${t.value}) gin_trgm_ops`
    ),

    // Optional: ensure locale is not empty string
    check("names_locale_not_empty", sql`btrim(${t.locale}) <> ''`),

    // Exactly one *accepted scientific* per taxon
    uniqueIndex("names_accepted_scientific_uq")
      .on(t.taxonId)
      .where(sql`${t.locale} = 'sci' AND ${t.isPreferred} = true`),

    // At most one *preferred name per locale* per taxon
    uniqueIndex("names_preferred_per_locale_uq")
      .on(t.taxonId, t.locale)
      .where(sql`${t.isPreferred} = true`),

    // De-dup per (taxon, locale, normalized value) — scientific OR common
    uniqueIndex("names_value_norm_uq").on(
      t.taxonId,
      sql`lower(btrim(${t.locale}))`,
      sql`lower(btrim(${t.value}))`
    ),
  ]
);
