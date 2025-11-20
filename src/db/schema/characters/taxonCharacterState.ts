import { sql } from "drizzle-orm";
import {
  check,
  doublePrecision,
  index,
  integer,
  pgTable,
  serial,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { withTimestamps } from "../../utils/timestamps";
import { taxon } from "../taxa/taxon";
import { categoricalTraitValue } from "./categoricalTrait";
import { character } from "./character";

/**
 * Taxon <-> categorical character states.
 */
export const taxonCharacterStateCategorical = pgTable(
  "taxon_character_state_categorical",
  withTimestamps({
    id: serial("id").primaryKey(),
    taxonId: integer("taxon_id")
      .notNull()
      .references(() => taxon.id, { onDelete: "cascade" }),
    characterId: integer("character_id")
      .notNull()
      .references(() => character.id, { onDelete: "restrict" }),
    traitValueId: integer("trait_value_id")
      .notNull()
      .references(() => categoricalTraitValue.id, { onDelete: "restrict" }),
  }),
  (t) => [
    // Prevent duplicate selections for the same taxon+character+trait
    uniqueIndex("tcs_cat_unique").on(t.taxonId, t.characterId, t.traitValueId),
    // Index on 'Amanita muscaria'
    index("tcs_cat_taxon_idx").on(t.taxonId),
    // Index on 'cap color'
    index("tcs_cat_character_idx").on(t.characterId),
    // Index on 'red'
    index("tcs_cat_trait_idx").on(t.traitValueId),
    // Index for joins when fetching taxa with a given character state
    index("tcs_cat_character_trait_idx").on(t.characterId, t.traitValueId),
  ]
);

/**
 * Single numeric value (stored in the character’s canonical unit if provided).
 */
export const taxonCharacterNumber = pgTable(
  "taxon_character_number",
  withTimestamps({
    id: serial("id").primaryKey(),
    taxonId: integer("taxon_id")
      .notNull()
      .references(() => taxon.id, { onDelete: "cascade" }),
    characterId: integer("character_id")
      .notNull()
      .references(() => character.id, { onDelete: "restrict" }),
    valueNum: doublePrecision("value_num").notNull(),
  }),
  (t) => [
    // One numeric value per taxon+character
    uniqueIndex("tcn_taxon_char_uq").on(t.taxonId, t.characterId),

    // Ensure value is finite (no NaN, +/- Infinity)
    check(
      "tcn_value_finite",
      sql`${t.valueNum} = ${t.valueNum} AND ${t.valueNum} > '-Infinity'::float8 AND ${t.valueNum} < 'Infinity'::float8`
    ),

    index("tcn_taxon_idx").on(t.taxonId),
    index("tcn_char_idx").on(t.characterId),
  ]
);

/**
 * Numeric range (min/max), in the character’s canonical unit if provided.
 */
export const taxonCharacterNumberRange = pgTable(
  "taxon_character_number_range",
  withTimestamps({
    id: serial("id").primaryKey(),
    taxonId: integer("taxon_id")
      .notNull()
      .references(() => taxon.id, { onDelete: "cascade" }),
    characterId: integer("character_id")
      .notNull()
      .references(() => character.id, { onDelete: "restrict" }),
    valueMin: doublePrecision("value_min").notNull(),
    valueMax: doublePrecision("value_max").notNull(),
  }),
  (t) => [
    // One numeric range per taxon+character
    uniqueIndex("tcnr_taxon_char_uq").on(t.taxonId, t.characterId),

    // Enforce min <= max
    check("tcnr_min_le_max", sql`${t.valueMin} <= ${t.valueMax}`),

    // Ensure both bounds are finite
    check(
      "tcnr_values_finite",
      sql`
        ${t.valueMin} = ${t.valueMin}
        AND ${t.valueMin} > '-Infinity'::float8
        AND ${t.valueMin} < 'Infinity'::float8
        AND ${t.valueMax} = ${t.valueMax}
        AND ${t.valueMax} > '-Infinity'::float8
        AND ${t.valueMax} < 'Infinity'::float8
      `
    ),

    index("tcnr_taxon_idx").on(t.taxonId),
    index("tcnr_char_idx").on(t.characterId),
  ]
);
