import {
  index,
  integer,
  pgTable,
  serial,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { withTimestamps } from "../../utils/timestamps";
import { taxa } from "../taxa/taxa";
import { categoricalTraitValues } from "./categoricalTraits";
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
    traitValueId: integer("trait_value_id")
      .notNull()
      .references(() => categoricalTraitValues.id, { onDelete: "restrict" }),
  }),
  (t) => [
    // Prevent duplicate selections for the same taxon+character+trait
    uniqueIndex("tcv_cat_unique").on(t.taxonId, t.characterId, t.traitValueId),
    // Index on 'Amanita muscaria'
    index("tcv_cat_taxon_idx").on(t.taxonId),
    // Index on 'cap color'
    index("tcv_cat_character_idx").on(t.characterId),
    // Index on 'red'
    index("tcv_cat_trait_idx").on(t.traitValueId),
  ]
);
