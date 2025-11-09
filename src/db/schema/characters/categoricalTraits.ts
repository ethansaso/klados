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
 * Trait sets (e.g., "colors") which can be used for one or more characters.
 */
export const categoricalTraitSets = pgTable(
  "categorical_trait_sets",
  withTimestamps({
    id: serial("id").primaryKey(),
    key: text("key").notNull(),
    label: text("label").notNull(),
    description: text("description"),
  }),
  (t) => [uniqueIndex("trait_sets_key_uq").on(t.key)]
);

/**
 * Values inside a trait set (e.g., "red", "green").
 */
export const categoricalTraitValues = pgTable(
  "categorical_trait_values",
  withTimestamps({
    id: serial("id").primaryKey(),
    setId: integer("set_id")
      .notNull()
      .references(() => categoricalTraitSets.id, { onDelete: "restrict" }),
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

    // Index to ensure unique keys WITHIN each trait set
    // I.e. "green" can exist both in "cap color" and "spore color", but not twice in "cap color"
    uniqueIndex("trait_values_set_key_uq").on(t.setId, t.key),

    // Fast lookups by set and by canonical target
    index("trait_values_set_idx").on(t.setId),
    index("trait_values_canonical_target_idx").on(t.canonicalValueId),

    // CHECK #1: role consistency (canonical ⇒ null target; alias ⇒ non-null target)
    check(
      "trait_values_role_consistency_ck",
      sql`CASE WHEN ${t.isCanonical} THEN ${t.canonicalValueId} IS NULL
        ELSE ${t.canonicalValueId} IS NOT NULL END`
    ),

    // CHECK #2: no self-alias if canonical_value_id is set
    check(
      "trait_values_no_self_alias_ck",
      sql`${t.canonicalValueId} IS NULL OR ${t.canonicalValueId} <> ${t.id}`
    ),
  ]
);
