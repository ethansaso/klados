import {
  boolean,
  index,
  integer,
  pgEnum,
  pgTable,
  serial,
  text,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { withTimestamps } from "../../utils/timestamps";
import { categoricalTraitSet } from "./categoricalTrait";
import { characterGroup } from "./characterGroup";

export const character = pgTable(
  "character",
  withTimestamps({
    id: serial("id").primaryKey(),
    key: text("key").notNull(),
    label: text("label").notNull(),
    description: text("description").notNull().default(""),
    groupId: integer("group_id")
      .notNull()
      .references(() => characterGroup.id, { onDelete: "restrict" }),
  }),
  (t) => [
    uniqueIndex("characters_key_uq").on(t.key),
    index("characters_group_idx").on(t.groupId),
  ]
);

/**
 * Categorical-specific metadata for a character.
 * One-to-one with characters where kind='categorical'.
 */
export const categoricalCharacterMeta = pgTable(
  "categorical_character_meta",
  withTimestamps({
    characterId: integer("character_id")
      .primaryKey()
      .references(() => character.id, { onDelete: "cascade" }),
    traitSetId: integer("trait_set_id")
      .notNull()
      .references(() => categoricalTraitSet.id, { onDelete: "restrict" }),
    isMultiSelect: boolean("is_multi_select").notNull(),
  })
);

/**
 * Numeric character kind: single value vs range.
 */
const numericCharacterKind = pgEnum("numeric_character_kind", [
  "single",
  "range",
]);

/**
 * Canonical storage/display units for numeric characters.
 * TODO: evaluate a better way to handle units
 */
const numericUnit = pgEnum("numeric_unit", [
  "um",
  "mm",
  "cm",
  "m",
  "count",
  "percent",
]);

/**
 * Numeric-specific metadata for a character.
 * One-to-one with characters where the character represents
 * a numeric measurement (single value or range).
 *
 * Values for these characters are stored per-taxon in:
 * - taxon_character_number (kind='single')
 * - taxon_character_number_range (kind='range')
 */
export const numericCharacterMeta = pgTable(
  "numeric_character_meta",
  withTimestamps({
    characterId: integer("character_id")
      .primaryKey()
      .references(() => character.id, { onDelete: "cascade" }),

    // Controls which taxon table is used and which UI control is rendered.
    kind: numericCharacterKind("kind").notNull(), // 'single' | 'range'

    // Canonical unit for storage & display (e.g. 'mm', 'cm', 'um').
    unit: numericUnit("unit").notNull(),
  })
);
