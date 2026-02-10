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
import { unitFamily } from "./units";

export const character = pgTable(
  "character",
  withTimestamps({
    id: serial("id").primaryKey(),
    key: text("key").notNull(),
    label: text("label").notNull(),
    description: text("description").notNull().default(""),
  }),
  (t) => [uniqueIndex("characters_key_uq").on(t.key)],
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
    isMultiSelect: boolean("is_multi_select").notNull(),
  }),
);

/**
 * Numeric character kind: single value vs range.
 */
const numericCharacterKind = pgEnum("numeric_character_kind", [
  "single",
  "range",
]);

/**
 * Numeric-specific metadata for a character.
 * Can represent either single-value or range characters.
 */
export const numericCharacterMeta = pgTable(
  "numeric_character_meta",
  withTimestamps({
    characterId: integer("character_id")
      .primaryKey()
      .references(() => character.id, { onDelete: "cascade" }),

    // Controls which taxon table is used and which UI control is rendered.
    kind: numericCharacterKind("kind").notNull(), // 'single' | 'range'

    // Dimension family for values
    unitFamilyId: integer("unit_family_id")
      .notNull()
      .references(() => unitFamily.id, { onDelete: "restrict" }),
  }),
  (t) => [index("numeric_meta_unit_family_idx").on(t.unitFamilyId)],
);
