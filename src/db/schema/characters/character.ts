import {
  boolean,
  index,
  integer,
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
