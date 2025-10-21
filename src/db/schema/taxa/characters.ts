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
} from "drizzle-orm/pg-core";
import { withTimestamps } from "../../utils/timestamps";
import { characterGroups } from "./characterGroups";

/** Shapes of the possible values of a character. */
export const characterValueType = pgEnum("character_value_type", [
  "categorical",
  "number",
  "number_range",
]);

/** Global character catalog. */
export const characters = pgTable(
  "characters",
  withTimestamps({
    id: serial("id").primaryKey(),
    /** Machine-stable key, e.g. "cap_shape" */
    key: text("key").notNull(),
    /** Human-readable label */
    label: text("label").notNull(),
    description: text("description"),
    valueType: characterValueType("value_type").notNull(),
    unit: text("unit"),
    maxStates: integer("max_states"),
    isActive: boolean("is_active").notNull().default(true),
    groupId: integer("group_id")
      .notNull()
      .references(() => characterGroups.id, { onDelete: "restrict" }),
  }),
  (t) => [
    uniqueIndex("characters_key_uq").on(t.key),

    // If valueType = 'number' or 'number_range', unit may be set; otherwise keep unit NULL
    check(
      "characters_unit_numeric_only",
      sql`
        (${t.valueType} IN ('number','number_range'))
        OR (${t.unit} IS NULL)
      `
    ),

    // If valueType = 'categorical', maxStates may be set; otherwise keep it NULL
    check(
      "characters_max_states_categorical_only",
      sql`
        (${t.valueType} = 'categorical')
        OR (${t.maxStates} IS NULL)
      `
    ),

    // If provided, enforce maxStates >= 1
    check(
      "characters_max_states_min_one",
      sql`${t.maxStates} IS NULL OR ${t.maxStates} >= 1`
    ),
  ]
);

export const characterStates = pgTable(
  "character_states",
  withTimestamps({
    id: serial("id").primaryKey(),

    characterId: integer("character_id")
      .notNull()
      .references(() => characters.id, { onDelete: "cascade" }),

    /** Single required field: the canonical, normalized value (e.g., "convex", "dark purple") */
    value: text("value").notNull(),

    isActive: boolean("is_active").notNull().default(true),
  }),
  (t) => [
    // Disallow duplicates per character
    uniqueIndex("character_states_character_value_uq").on(
      t.characterId,
      t.value
    ),
    // Collapse whitespace, force lowercase
    check(
      "character_states_value_canonical",
      sql`${t.value} = lower(btrim(regexp_replace(${t.value}, '[[:space:]]+', ' ', 'g')))`
    ),
    index("character_states_character_idx").on(t.characterId),
  ]
);
