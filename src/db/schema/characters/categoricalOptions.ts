import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  foreignKey,
  index,
  integer,
  pgTable,
  serial,
  text,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { withTimestamps } from "../../utils/timestamps";

/**
 * Option sets (e.g., "colors") which can be used for one or more characters.
 */
export const categoricalOptionSets = pgTable(
  "categorical_option_sets",
  withTimestamps({
    id: serial("id").primaryKey(),
    key: text("key").notNull(),
    label: text("label").notNull(),
    description: text("description"),
  }),
  (t) => [uniqueIndex("option_sets_key_uq").on(t.key)]
);

/**
 * Values inside an option set (e.g., "red", "green").
 */
export const categoricalOptionValues = pgTable(
  "categorical_option_values",
  withTimestamps({
    id: serial("id").primaryKey(),
    setId: integer("set_id")
      .notNull()
      .references(() => categoricalOptionSets.id, { onDelete: "restrict" }),
    key: text("key").notNull(),
    label: text("label").notNull(),
    isCanonical: boolean("is_canonical").notNull().default(true),
    canonicalValueId: integer("canonical_value_id"),
  }),
  (t) => [
    // ? FKs here avoids circular reference causing TS problems
    foreignKey({
      name: "canonical_value_id_fk",
      columns: [t.canonicalValueId],
      foreignColumns: [t.id],
    }).onDelete("restrict"),

    // Index to ensure unique keys WITHIN each option set
    // I.e. "green" can exist both in "cap color" and "spore color", but not twice in "cap color"
    uniqueIndex("option_values_set_key_uq").on(t.setId, t.key),

    // Fast lookups by set and by canonical target
    index("option_values_set_idx").on(t.setId),
    index("option_values_canonical_target_idx").on(t.canonicalValueId),

    // CHECK #1: role consistency (canonical ⇒ null target; alias ⇒ non-null target)
    check(
      "option_values_role_consistency_ck",
      sql`CASE WHEN ${t.isCanonical} THEN ${t.canonicalValueId} IS NULL
        ELSE ${t.canonicalValueId} IS NOT NULL END`
    ),

    // CHECK #2: no self-alias if canonical_value_id is set
    check(
      "option_values_no_self_alias_ck",
      sql`${t.canonicalValueId} IS NULL OR ${t.canonicalValueId} <> ${t.id}`
    ),
  ]
);
