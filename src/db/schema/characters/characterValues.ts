import {
  index,
  integer,
  pgTable,
  serial,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { withTimestamps } from "../../utils/timestamps";
import { taxa } from "../taxa/taxa";
import { categoricalOptionValues } from "./categoricalOptions";
import { characters } from "./characters";

/**
 * Taxon <-> categorical character states.
 */
export const characterValueCategorical = pgTable(
  "character_value_categorical",
  withTimestamps({
    id: serial("id").primaryKey(),
    taxonId: integer("taxon_id")
      .notNull()
      .references(() => taxa.id, { onDelete: "cascade" }),
    characterId: integer("character_id")
      .notNull()
      .references(() => characters.id, { onDelete: "restrict" }),
    optionValueId: integer("option_value_id")
      .notNull()
      .references(() => categoricalOptionValues.id, { onDelete: "restrict" }),
  }),
  (t) => [
    // Prevent duplicate selections for the same taxon+character+option
    uniqueIndex("tcv_cat_unique").on(t.taxonId, t.characterId, t.optionValueId),
    // Index on 'Amanita muscaria'
    index("tcv_cat_taxon_idx").on(t.taxonId),
    // Index on 'cap color'
    index("tcv_cat_character_idx").on(t.characterId),
    // Index on 'red'
    index("tcv_cat_option_idx").on(t.optionValueId),
  ]
);
