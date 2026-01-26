import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  numeric,
  pgTable,
  serial,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { withTimestamps } from "../../utils/timestamps";
import { taxon } from "../taxa/taxon";
import { character, numericCharacterMeta } from "./characters";
import { categoricalTraitValue } from "./traits";
import { unit } from "./units";

/**
 * Taxon <-> categorical character states.
 *
 * NOTE: there is nothing preventing the use of a trait which is not part of the
 * character's trait set; this should be enforced at the application level.
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
  ],
);

/**
 * Single numeric value.
 *
 * **siBaseValue** is stored in SI base units for the character's unit family.
 * **displayUnitId** is the unit to reconstruct/display in UI.
 */
export const taxonCharacterStateNumber = pgTable(
  "taxon_character_number",
  withTimestamps({
    id: serial("id").primaryKey(),

    taxonId: integer("taxon_id")
      .notNull()
      .references(() => taxon.id, { onDelete: "cascade" }),

    // Can only reference numeric characters
    characterId: integer("character_id")
      .notNull()
      .references(() => numericCharacterMeta.characterId, {
        onDelete: "restrict",
      }),

    // Stored canonical/base value -- see notes in units schema
    siBaseValue: numeric("si_base_value", {
      precision: 30,
      scale: 18,
    }).notNull(),

    // Unit to use for reconstructing/displaying value (nullable for unitless families)
    displayUnitId: integer("display_unit_id").references(() => unit.id, {
      onDelete: "restrict",
    }),
  }),
  (t) => [
    uniqueIndex("tcn_taxon_char_uq").on(t.taxonId, t.characterId),
    index("tcn_taxon_idx").on(t.taxonId),
    index("tcn_char_idx").on(t.characterId),
    index("tcn_display_unit_idx").on(t.displayUnitId),
  ],
);

/**
 * Numeric range character state (min/max).
 *
 * Values stored in SI base units for the character's unit family.
 * displayUnitId is the unit to reconstruct/display in UI (and for editing).
 */
export const taxonCharacterStateRange = pgTable(
  "taxon_character_number_range",
  withTimestamps({
    id: serial("id").primaryKey(),
    taxonId: integer("taxon_id")
      .notNull()
      .references(() => taxon.id, { onDelete: "cascade" }),
    characterId: integer("character_id")
      .notNull()
      .references(() => numericCharacterMeta.characterId, {
        onDelete: "restrict",
      }),

    siBaseMin: numeric("si_base_min", { precision: 30, scale: 18 }).notNull(),
    siBaseMax: numeric("si_base_max", { precision: 30, scale: 18 }).notNull(),

    displayUnitId: integer("display_unit_id").references(() => unit.id, {
      onDelete: "restrict",
    }),
  }),
  (t) => [
    uniqueIndex("tcnr_taxon_char_uq").on(t.taxonId, t.characterId),

    check("tcnr_min_le_max_ck", sql`${t.siBaseMin} <= ${t.siBaseMax}`),

    index("tcnr_taxon_idx").on(t.taxonId),
    index("tcnr_char_idx").on(t.characterId),
    index("tcnr_display_unit_idx").on(t.displayUnitId),
  ],
);
