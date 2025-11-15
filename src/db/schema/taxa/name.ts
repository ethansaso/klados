import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  pgEnum,
  pgTable,
  serial,
  text,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";
import { withTimestamps } from "../../utils/timestamps";
import { taxon } from "./taxon";

export const nameKind = pgEnum("name_kind", ["common", "scientific"]);

export const taxonName = pgTable(
  "taxon_name",
  withTimestamps({
    id: serial("id").primaryKey(),

    taxonId: integer("taxon_id")
      .notNull()
      .references(() => taxon.id, { onDelete: "cascade" }),

    kind: nameKind("kind").notNull(),
    value: text("value").notNull(),

    /** BCP-47 like "en" / "en-US"; only for common names */
    locale: varchar("locale", { length: 16 }),

    /**
     * Unified "preferred" flag.
     * Scientific: 'true' indicates accepted name.
     * Common: 'true' indicates preferred name for locale.
     */
    isPreferred: boolean("is_preferred").notNull().default(false),
  }),
  (t) => [
    // Fast filters
    index("names_taxon_idx").on(t.taxonId),
    index("names_taxon_kind_idx").on(t.taxonId, t.kind),
    index("names_taxon_locale_idx").on(t.taxonId, t.locale),

    // Fast for fetching accepted scientific name
    index("names_sci_accepted_idx")
      .on(t.taxonId)
      .where(sql`${t.kind} = 'scientific' AND ${t.isPreferred} = true`),

    // Trigram GIN index for searching names w/ ILIKE
    index("names_value_trgm_lower_idx").using(
      "gin",
      sql`lower(${t.value}) gin_trgm_ops`
    ),

    // Enforce field applicability by kind
    // - Common: locale required
    // - Scientific: locale must be NULL
    check(
      "names_kind_field_rules",
      sql`
        (
          ${t.kind} = 'common'
          AND ${t.locale} IS NOT NULL
        )
        OR
        (
          ${t.kind} = 'scientific'
          AND ${t.locale} IS NULL
        )
      `
    ),

    // Exactly one *accepted scientific* per taxon
    uniqueIndex("names_accepted_scientific_uq")
      .on(t.taxonId)
      .where(sql`${t.kind} = 'scientific' AND ${t.isPreferred} = true`),

    // At most one *preferred common* per (taxon, locale)
    uniqueIndex("names_preferred_common_uq")
      .on(t.taxonId, t.locale)
      .where(sql`${t.kind} = 'common' AND ${t.isPreferred} = true`),

    // Only one name per taxon/kind/locale (case/space normalized)
    uniqueIndex("names_value_norm_uq").on(
      t.taxonId,
      t.kind,
      sql`coalesce(${t.locale}, '')`,
      sql`lower(btrim(${t.value}))`
    ),
  ]
);
