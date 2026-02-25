import { sql } from "drizzle-orm";
import {
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
import { categoricalCharacterMeta } from "./characters";

/**
 * Values for categorical characters (e.g., "red", "green" for "color").
 */
export const categoricalTraitValue = pgTable(
  "categorical_trait_value",
  withTimestamps({
    id: serial("id").primaryKey(),
    characterId: integer("character_id")
      .notNull()
      .references(() => categoricalCharacterMeta.characterId, {
        onDelete: "cascade",
      }),
    label: text("label").notNull(),
    hexCode: text("hex_code"),
    description: text("description").notNull().default(""),
    canonicalValueId: integer("canonical_value_id"),
  }),
  (t) => [
    unique("trait_values_character_id_id_uq").on(t.characterId, t.id),
    foreignKey({
      name: "canonical_value_same_character_fk",
      columns: [t.characterId, t.canonicalValueId],
      foreignColumns: [t.characterId, t.id],
    }).onDelete("cascade"),

    uniqueIndex("trait_values_character_label_uq").on(t.characterId, t.label),
    index("trait_values_character_idx").on(t.characterId),
    index("trait_values_canonical_target_idx")
      .on(t.canonicalValueId)
      .where(sql`${t.canonicalValueId} IS NOT NULL`),

    check(
      "trait_values_no_self_alias_ck",
      sql`${t.canonicalValueId} IS NULL OR ${t.canonicalValueId} <> ${t.id}`,
    ),
    check(
      "trait_values_hex_code_format_ck",
      sql`${t.hexCode} IS NULL OR ${t.hexCode} ~ '^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$'`,
    ),
    check(
      "trait_values_hex_code_canonical_ck",
      sql`${t.canonicalValueId} IS NULL OR ${t.hexCode} IS NULL`,
    ),
    check(
      "trait_values_description_canonical_ck",
      sql`${t.canonicalValueId} IS NULL OR ${t.description} = ''`,
    ),
  ],
);
