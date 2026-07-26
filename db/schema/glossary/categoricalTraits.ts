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
 * A set of interchangeable trait labels within one character.
 * All traits must belong to one, even if having only one member.
 * ! THIS TABLE OWNS NO METADATA (hexCode, description, etc.) AND MUST NEVER OWN ANY.
 */
export const traitSynonymSet = pgTable(
  "trait_synonym_set",
  withTimestamps({
    id: serial("id").primaryKey(),
    characterId: integer("character_id")
      .notNull()
      .references(() => categoricalCharacterMeta.characterId, {
        onDelete: "cascade",
      }),
  }),
  (t) => [
    // Composite target so trait values can prove same-character membership
    unique("trait_synonym_set_character_id_id_uq").on(t.characterId, t.id),
    index("trait_synonym_set_character_idx").on(t.characterId),
  ],
);

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
    synonymSetId: integer("synonym_set_id").notNull(),
    label: text("label").notNull(),
    hexCode: text("hex_code"),
    description: text("description").notNull().default(""),
  }),
  (t) => [
    // Composite target for the state tables — DO NOT REMOVE
    unique("trait_values_character_id_id_uq").on(t.characterId, t.id),

    // Composite target for a future denormalized set id on state rows
    unique("trait_values_char_id_set_uq").on(
      t.characterId,
      t.id,
      t.synonymSetId,
    ),

    // Set must belong to the same character
    foreignKey({
      name: "trait_value_synonym_set_same_character_fk",
      columns: [t.characterId, t.synonymSetId],
      foreignColumns: [traitSynonymSet.characterId, traitSynonymSet.id],
    }).onDelete("restrict"),

    uniqueIndex("trait_values_character_label_uq").on(t.characterId, t.label),
    index("trait_values_character_idx").on(t.characterId),
    index("trait_values_set_idx").on(t.synonymSetId),

    check(
      "trait_values_hex_code_format_ck",
      sql`${t.hexCode} IS NULL OR ${t.hexCode} ~ '^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$'`,
    ),
  ],
);
