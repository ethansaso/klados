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
import { categoricalOptionSets } from "./categoricalOptions";
import { characterGroups } from "./characterGroups";

export const characters = pgTable(
  "characters",
  withTimestamps({
    id: serial("id").primaryKey(),
    key: text("key").notNull(),
    label: text("label").notNull(),
    description: text("description"),
    groupId: integer("group_id")
      .notNull()
      .references(() => characterGroups.id, { onDelete: "restrict" }),
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
export const characterCategoricalMeta = pgTable(
  "character_categorical_meta",
  withTimestamps({
    characterId: integer("character_id")
      .primaryKey()
      .references(() => characters.id, { onDelete: "cascade" }),
    optionSetId: integer("option_set_id")
      .notNull()
      .references(() => categoricalOptionSets.id, { onDelete: "restrict" }),
    isMultiSelect: boolean("is_multi_select").notNull().default(true),
  })
);
