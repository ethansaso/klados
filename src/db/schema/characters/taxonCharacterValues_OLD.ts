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
import { taxa } from "../taxa/taxa";
import { characters, characterStates } from "./characters";

/**
 * Categorical selections (one row per selected state).
 */
export const taxonCharacterState = pgTable(
  "taxon_character_state",
  withTimestamps({
    id: serial("id").primaryKey(),
    taxonId: integer("taxon_id")
      .notNull()
      .references(() => taxa.id, { onDelete: "cascade" }),
    stateId: integer("state_id")
      .notNull()
      .references(() => characterStates.id, { onDelete: "restrict" }),
  }),
  (t) => [
    uniqueIndex("tcs_taxon_char_state_uq").on(t.taxonId, t.stateId),
    index("tcs_taxon_idx").on(t.taxonId),
    index("tcs_state_idx").on(t.stateId),
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
      .references(() => taxa.id, { onDelete: "cascade" }),
    characterId: integer("character_id")
      .notNull()
      .references(() => characters.id, { onDelete: "cascade" }),
    valueNum: doublePrecision("value_num").notNull(),
  }),
  (t) => [
    uniqueIndex("tcn_taxon_char_uq").on(t.taxonId, t.characterId),
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
      .references(() => taxa.id, { onDelete: "cascade" }),
    characterId: integer("character_id")
      .notNull()
      .references(() => characters.id, { onDelete: "cascade" }),
    valueMin: doublePrecision("value_min").notNull(),
    valueMax: doublePrecision("value_max").notNull(),
  }),
  (t) => [
    uniqueIndex("tcnr_taxon_char_uq").on(t.taxonId, t.characterId),
    check("tcnr_min_le_max", sql`${t.valueMin} <= ${t.valueMax}`),
    check(
      "tcnr_values_finite",
      sql`
    ${t.valueMin} = ${t.valueMin} AND ${t.valueMin} > '-Infinity'::float8 AND ${t.valueMin} < 'Infinity'::float8
    AND
    ${t.valueMax} = ${t.valueMax} AND ${t.valueMax} > '-Infinity'::float8 AND ${t.valueMax} < 'Infinity'::float8
  `
    ),
    index("tcnr_taxon_idx").on(t.taxonId),
    index("tcnr_char_idx").on(t.characterId),
  ]
);
