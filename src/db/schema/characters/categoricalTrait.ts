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
  unique,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { withTimestamps } from "../../utils/timestamps";

/**
 * Trait sets (e.g., "colors") which can be used for one or more characters.
 */
export const categoricalTraitSet = pgTable(
  "categorical_trait_set",
  withTimestamps({
    id: serial("id").primaryKey(),
    key: text("key").notNull(),
    label: text("label").notNull(),
    description: text("description").notNull().default(""),
  }),
  (t) => [uniqueIndex("trait_sets_key_uq").on(t.key)]
);

/**
 * Values inside a trait set (e.g., "red", "green").
 */
export const categoricalTraitValue = pgTable(
  "categorical_trait_value",
  withTimestamps({
    id: serial("id").primaryKey(),
    // Cascade is safe here -- the taxonCharacterStateCategorical table
    // handles prevention of deleting in-use trait values via its FKs
    setId: integer("set_id")
      .notNull()
      .references(() => categoricalTraitSet.id, { onDelete: "cascade" }),
    key: text("key").notNull(),
    label: text("label").notNull(),
    /** Optional hexadecimal color code (e.g., "#ff0000") */
    hexCode: text("hex_code"),
    /** Optional description */
    description: text("description").notNull().default(""),
    isCanonical: boolean("is_canonical").notNull().default(true),
    canonicalValueId: integer("canonical_value_id"),
  }),
  (t) => [
    // Make (set_id, id) uniquely addressable so it can be FK-targeted...
    unique("trait_values_set_id_id_uq").on(t.setId, t.id),
    // ...then create composite FK to enforce that canonicalValueId refers to a value in the same set
    foreignKey({
      name: "canonical_value_same_set_fk",
      columns: [t.setId, t.canonicalValueId],
      foreignColumns: [t.setId, t.id],
    }).onDelete("cascade"),

    // Index to ensure unique keys WITHIN each trait set
    // I.e. "green" can exist both in "cap color" and "spore color", but not twice in "cap color"
    uniqueIndex("trait_values_set_key_uq").on(t.setId, t.key),

    // Fast lookups by set and by canonical target
    index("trait_values_set_idx").on(t.setId),
    index("trait_values_canonical_target_idx")
      .on(t.canonicalValueId)
      .where(sql`${t.canonicalValueId} IS NOT NULL`),

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

    // CHECK #3: hex code format (if present)
    check(
      "trait_values_hex_code_format_ck",
      sql`${t.hexCode} IS NULL OR ${t.hexCode} ~ '^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$'`
    ),

    // CHECK #4: prevent usage of hex codes for non-canonical values
    check(
      "trait_values_hex_code_canonical_ck",
      sql`CASE WHEN ${t.isCanonical} THEN TRUE
        ELSE ${t.hexCode} IS NULL END`
    ),

    // CHECK #5: prevent usage of description for non-canonical values
    check(
      "trait_values_description_canonical_ck",
      sql`CASE WHEN ${t.isCanonical} THEN TRUE
    ELSE ${t.description} = '' END`
    ),
  ]
);
