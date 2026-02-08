import {
  index,
  integer,
  pgTable,
  serial,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { withTimestamps } from "../../utils/timestamps";
import { characterGroup } from "../characters/groups";
import { taxon } from "./taxon";

/**
 * Explicit attachment of a morphological character group to a taxon.
 *
 * This encodes structural presence (e.g. "cap", "universal veil")
 * independently of any character states.
 */
export const taxonCharacterGroupState = pgTable(
  "taxon_character_group_state",
  withTimestamps({
    id: serial("id").primaryKey(),
    taxonId: integer("taxon_id")
      .notNull()
      .references(() => taxon.id, { onDelete: "cascade" }),
    groupId: integer("group_id")
      .notNull()
      .references(() => characterGroup.id, { onDelete: "restrict" }),
  }),
  (t) => [
    // A taxon can only attach a given group once
    uniqueIndex("taxon_character_group_state_taxon_group_uq").on(
      t.taxonId,
      t.groupId,
    ),

    // ! REQUIRED FOR COMPOSITE FKs FROM STATE TABLES !
    uniqueIndex("taxon_character_group_state_id_group_uq").on(t.id, t.groupId),

    // Common access patterns
    index("taxon_character_group_state_taxon_idx").on(t.taxonId),
    index("taxon_character_group_state_group_idx").on(t.groupId),
  ],
);
