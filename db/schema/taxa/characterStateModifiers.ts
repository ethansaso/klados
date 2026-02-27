import {
  index,
  integer,
  pgTable,
  serial,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { withTimestamps } from "../../utils/timestamps";
import { modifierValue } from "../glossary/modifiers";
import {
  taxonCharacterStateCategorical,
  taxonCharacterStateNumber,
  taxonCharacterStateRange,
} from "./characterStates";

export const taxonCharacterStateModifierCategorical = pgTable(
  "taxon_character_state_modifier_categorical",
  withTimestamps({
    id: serial("id").primaryKey(),
    taxonCharacterStateCategoricalId: integer(
      "taxon_character_state_categorical_id",
    )
      .notNull()
      .references(() => taxonCharacterStateCategorical.id, {
        onDelete: "cascade",
      }),
    modifierId: integer("modifier_id")
      .notNull()
      .references(() => modifierValue.id, { onDelete: "restrict" }),
  }),
  (t) => [
    uniqueIndex("tcsmc_state_mod_uq").on(
      t.taxonCharacterStateCategoricalId,
      t.modifierId,
    ),
    index("tcsmc_state_idx").on(t.taxonCharacterStateCategoricalId),
    index("tcsmc_mod_idx").on(t.modifierId),
  ],
);

export const taxonCharacterStateModifierNumber = pgTable(
  "taxon_character_state_modifier_number",
  withTimestamps({
    id: serial("id").primaryKey(),
    taxonCharacterStateNumberId: integer("taxon_character_state_number_id")
      .notNull()
      .references(() => taxonCharacterStateNumber.id, { onDelete: "cascade" }),
    modifierId: integer("modifier_id")
      .notNull()
      .references(() => modifierValue.id, { onDelete: "restrict" }),
  }),
  (t) => [
    uniqueIndex("tcsmn_state_mod_uq").on(
      t.taxonCharacterStateNumberId,
      t.modifierId,
    ),
    index("tcsmn_state_idx").on(t.taxonCharacterStateNumberId),
    index("tcsmn_mod_idx").on(t.modifierId),
  ],
);

export const taxonCharacterStateModifierRange = pgTable(
  "taxon_character_state_modifier_range",
  withTimestamps({
    id: serial("id").primaryKey(),
    taxonCharacterStateRangeId: integer("taxon_character_state_range_id")
      .notNull()
      .references(() => taxonCharacterStateRange.id, { onDelete: "cascade" }),
    modifierId: integer("modifier_id")
      .notNull()
      .references(() => modifierValue.id, { onDelete: "restrict" }),
  }),
  (t) => [
    uniqueIndex("tcsmr_state_mod_uq").on(
      t.taxonCharacterStateRangeId,
      t.modifierId,
    ),
    index("tcsmr_state_idx").on(t.taxonCharacterStateRangeId),
    index("tcsmr_mod_idx").on(t.modifierId),
  ],
);
