import { sql } from "drizzle-orm";
import {
  check,
  foreignKey,
  index,
  integer,
  numeric,
  pgTable,
  serial,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { withTimestamps } from "../../utils/timestamps";
import {
  categoricalCharacterMeta,
  character,
  numericCharacterMeta,
} from "../characters/characters";
import { categoricalTraitValue } from "../characters/traits";
import { unit } from "../characters/units";
import { taxonCharacterGroupState } from "./characterGroupStates";

// ! The tables in this file contain explicit stored group IDs and foreign keys
// ! to enforce that states belong to characters within the same group as the
// ! taxon-group-state via foreign keys.

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
    taxonGroupStateId: integer("taxon_group_state_id")
      .notNull()
      .references(() => taxonCharacterGroupState.id, { onDelete: "cascade" }),
    characterId: integer("character_id")
      .notNull()
      .references(() => categoricalCharacterMeta.characterId, {
        onDelete: "restrict",
      }),

    traitValueId: integer("trait_value_id")
      .notNull()
      .references(() => categoricalTraitValue.id, { onDelete: "restrict" }),

    // ! STORED GROUP ID - MUST MATCH BOTH TAXON GROUP AND CHARACTER !
    groupId: integer("group_id").notNull(),
  }),
  (t) => [
    // Prevent duplicate selections for the same group+character+trait
    uniqueIndex("tcs_cat_group_state_char_trait_uq").on(
      t.taxonGroupStateId,
      t.characterId,
      t.traitValueId,
    ),

    // Index on 'cap'
    index("tcs_cat_taxon_group_state_idx").on(t.taxonGroupStateId),
    // Index on 'cap color'
    index("tcs_cat_character_idx").on(t.characterId),
    // Index on 'red'
    index("tcs_cat_trait_idx").on(t.traitValueId),
    // Index for joins when fetching taxa with a given character state
    index("tcs_cat_character_trait_idx").on(t.characterId, t.traitValueId),

    // ! ENFORCES TAXON GROUP <-> GROUP ID CONSISTENCY !
    foreignKey({
      name: "tcs_cat_taxon_group_state_pair_fk",
      columns: [t.taxonGroupStateId, t.groupId],
      foreignColumns: [
        taxonCharacterGroupState.id,
        taxonCharacterGroupState.groupId,
      ],
    }),

    // ! ENFORCES CHARACTER BELONGS TO GROUP !
    foreignKey({
      name: "tcs_cat_character_group_fk",
      columns: [t.characterId, t.groupId],
      foreignColumns: [character.id, character.groupId],
    }),
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
    taxonGroupStateId: integer("taxon_group_state_id")
      .notNull()
      .references(() => taxonCharacterGroupState.id, { onDelete: "cascade" }),
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

    // ! STORED GROUP ID - MUST MATCH BOTH TAXON GROUP AND CHARACTER !
    groupId: integer("group_id").notNull(),
  }),
  (t) => [
    uniqueIndex("tcn_group_state_char_uq").on(
      t.taxonGroupStateId,
      t.characterId,
    ),

    index("tcn_taxon_group_state_idx").on(t.taxonGroupStateId),
    index("tcn_char_idx").on(t.characterId),
    index("tcn_display_unit_idx").on(t.displayUnitId),

    // ! ENFORCES TAXON GROUP <-> GROUP ID CONSISTENCY !
    foreignKey({
      name: "tcn_taxon_group_state_pair_fk",
      columns: [t.taxonGroupStateId, t.groupId],
      foreignColumns: [
        taxonCharacterGroupState.id,
        taxonCharacterGroupState.groupId,
      ],
    }),

    // ! ENFORCES CHARACTER <-> GROUP CONSISTENCY !
    foreignKey({
      name: "tcn_character_group_fk",
      columns: [t.characterId, t.groupId],
      foreignColumns: [character.id, character.groupId],
    }),
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
    taxonGroupStateId: integer("taxon_group_state_id")
      .notNull()
      .references(() => taxonCharacterGroupState.id, { onDelete: "cascade" }),
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

    // ! STORED GROUP ID - MUST MATCH BOTH TAXON GROUP AND CHARACTER !
    groupId: integer("group_id").notNull(),
  }),
  (t) => [
    uniqueIndex("tcnr_group_state_char_uq").on(
      t.taxonGroupStateId,
      t.characterId,
    ),

    check("tcnr_min_le_max_ck", sql`${t.siBaseMin} <= ${t.siBaseMax}`),

    index("tcnr_group_state_idx").on(t.taxonGroupStateId),
    index("tcnr_char_idx").on(t.characterId),
    index("tcnr_display_unit_idx").on(t.displayUnitId),

    // ! ENFORCES TAXON GROUP <-> GROUP ID CONSISTENCY !
    foreignKey({
      name: "tcnr_taxon_group_state_pair_fk",
      columns: [t.taxonGroupStateId, t.groupId],
      foreignColumns: [
        taxonCharacterGroupState.id,
        taxonCharacterGroupState.groupId,
      ],
    }),

    // ! ENFORCES CHARACTER <-> GROUP CONSISTENCY !
    foreignKey({
      name: "tcnr_character_group_fk",
      columns: [t.characterId, t.groupId],
      foreignColumns: [character.id, character.groupId],
    }),
  ],
);
