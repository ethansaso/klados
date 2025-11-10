import {
  index,
  integer,
  pgTable,
  serial,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { withTimestamps } from "../../utils/timestamps";
import { taxon } from "../taxa/taxon";
import { categoricalTraitValue } from "./categoricalTrait";
import { character } from "./character";

/**
 * Taxon <-> categorical character states.
 */
export const taxonCharacterStateCategorical = pgTable(
  "taxon_character_state_categorical",
  withTimestamps({
    id: serial("id").primaryKey(),
    taxonId: integer("taxon_id")
      .notNull()
      .references(() => taxon.id, { onDelete: "cascade" }),
    characterId: integer("character_id")
      .notNull()
      .references(() => character.id, { onDelete: "restrict" }),
    traitValueId: integer("trait_value_id")
      .notNull()
      .references(() => categoricalTraitValue.id, { onDelete: "restrict" }),
  }),
  (t) => [
    // Prevent duplicate selections for the same taxon+character+trait
    uniqueIndex("tcs_cat_unique").on(t.taxonId, t.characterId, t.traitValueId),
    // Index on 'Amanita muscaria'
    index("tcs_cat_taxon_idx").on(t.taxonId),
    // Index on 'cap color'
    index("tcs_cat_character_idx").on(t.characterId),
    // Index on 'red'
    index("tcs_cat_trait_idx").on(t.traitValueId),
    // Index for joins when fetching taxa with a given character state
    index("tcs_cat_character_trait_idx").on(t.characterId, t.traitValueId),
  ]
);
