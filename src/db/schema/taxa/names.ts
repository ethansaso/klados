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
import { taxa } from "./taxa";

export const nameKind = pgEnum("name_kind", ["common", "scientific"]);

export const scientificSynonymKind = pgEnum("scientific_synonym_kind", [
  "homotypic",
  "heterotypic",
  "misapplied",
]);

export const names = pgTable(
  "names",
  withTimestamps({
    id: serial("id").primaryKey(),
    taxonId: integer("taxon_id")
      .notNull()
      .references(() => taxa.id, { onDelete: "cascade" }),
    kind: nameKind("kind").notNull(),
    value: text("value").notNull(),

    /** BCP-47 like "en" / "en-US"; only for common names */
    locale: varchar("locale", { length: 16 }),

    /** Common only (one preferred per locale) */
    isPreferred: boolean("is_preferred").notNull().default(false),

    // Scientific-only: NULL = accepted; NOT NULL = synonym type
    synonymKind: scientificSynonymKind("synonym_kind"),
  }),
  (t) => [
    // Fast filters
    index("names_taxon_idx").on(t.taxonId),
    index("names_taxon_kind_idx").on(t.taxonId, t.kind),
    index("names_taxon_locale_idx").on(t.taxonId, t.locale),
    // ! TODO: Trigram GIN index for searching names w/ ILIKE
    // index("names_value_trgm_idx").using("gin", sql`(${t.value} gin_trgm_ops)`),

    // Enforce field applicability by kind
    // - Common: locale required; isAccepted must be false
    // - Scientific: locale must be NULL; isPreferred must be false
    check(
      "names_kind_field_rules",
      sql`
        (${t.kind} = 'common' AND ${t.locale} IS NOT NULL AND ${t.synonymKind} IS NULL)
        OR
        (${t.kind} = 'scientific' AND ${t.locale} IS NULL AND ${t.isPreferred} = false)
      `
    ),

    // Exactly one accepted scientific name per taxon
    uniqueIndex("names_accepted_scientific_uq")
      .on(t.taxonId)
      .where(sql`${t.kind} = 'scientific' AND ${t.synonymKind} IS NULL`),

    // At most one preferred common name per (taxon, locale)
    uniqueIndex("names_preferred_common_uq")
      .on(t.taxonId, t.locale)
      .where(sql`${t.kind} = 'common' AND ${t.isPreferred} = true`),

    // De-dup per taxon/kind/locale by normalized value (case/space insensitive)
    uniqueIndex("names_value_norm_uq").on(
      t.taxonId,
      t.kind,
      sql`coalesce(${t.locale}, '')`,
      sql`lower(btrim(${t.value}))`
    ),
  ]
);
