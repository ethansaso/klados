import { sql } from "drizzle-orm";
import {
  check,
  foreignKey,
  index,
  integer,
  numeric,
  pgTable,
  serial,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { withTimestamps } from "../../utils/timestamps";
import { categoricalTraitValue } from "../glossary/categoricalTraits";
import { characterFeature } from "../glossary/characterFeatures";
import {
  categoricalCharacterMeta,
  numericCharacterMeta,
} from "../glossary/characters";
import { unit } from "../glossary/units";
import { taxonFeatureState } from "./featureStates";

export const taxonCharacterStateCategorical = pgTable(
  "taxon_character_state_categorical",
  withTimestamps({
    id: serial("id").primaryKey(),

    taxonFeatureStateId: integer("taxon_feature_state_id")
      .notNull()
      .references(() => taxonFeatureState.id, { onDelete: "cascade" }),

    characterId: integer("character_id")
      .notNull()
      .references(() => categoricalCharacterMeta.characterId, {
        onDelete: "restrict",
      }),

    traitValueId: integer("trait_value_id")
      .notNull()
      .references(() => categoricalTraitValue.id, { onDelete: "restrict" }),

    // STORED FEATURE ID - MUST MATCH TAXON FEATURE + CHARACTER FEATURE
    featureId: integer("feature_id").notNull(),
  }),
  (t) => [
    uniqueIndex("tcs_cat_feature_state_char_trait_uq").on(
      t.taxonFeatureStateId,
      t.characterId,
      t.traitValueId,
    ),

    index("tcs_cat_taxon_feature_state_idx").on(t.taxonFeatureStateId),
    index("tcs_cat_character_idx").on(t.characterId),
    index("tcs_cat_trait_idx").on(t.traitValueId),
    index("tcs_cat_character_trait_idx").on(t.characterId, t.traitValueId),

    // Enforce taxonFeatureState <-> featureId consistency
    foreignKey({
      name: "tcs_cat_taxon_feature_state_pair_fk",
      columns: [t.taxonFeatureStateId, t.featureId],
      foreignColumns: [taxonFeatureState.id, taxonFeatureState.featureId],
    }),

    // Ensure this state references an existing (character, feature) pairing
    foreignKey({
      name: "tcs_cat_character_feature_fk",
      columns: [t.characterId, t.featureId],
      foreignColumns: [
        characterFeature.characterId,
        characterFeature.featureId,
      ],
    }),

    // Enforce traitValue <-> character consistency
    foreignKey({
      name: "tcs_cat_character_trait_same_character_fk",
      columns: [t.characterId, t.traitValueId],
      foreignColumns: [
        categoricalTraitValue.characterId,
        categoricalTraitValue.id,
      ],
    }),
  ],
);

export const taxonCharacterStateNumber = pgTable(
  "taxon_character_state_number",
  withTimestamps({
    id: serial("id").primaryKey(),

    taxonFeatureStateId: integer("taxon_feature_state_id")
      .notNull()
      .references(() => taxonFeatureState.id, { onDelete: "cascade" }),

    characterId: integer("character_id")
      .notNull()
      .references(() => numericCharacterMeta.characterId, {
        onDelete: "restrict",
      }),

    siBaseValue: numeric("si_base_value", {
      precision: 30,
      scale: 18,
    }).notNull(),

    displayUnitId: integer("display_unit_id").references(() => unit.id, {
      onDelete: "restrict",
    }),

    // STORED FEATURE ID - MUST MATCH TAXON FEATURE + CHARACTER FEATURE
    featureId: integer("feature_id").notNull(),
  }),
  (t) => [
    index("tcn_feature_state_char_idx").on(
      t.taxonFeatureStateId,
      t.characterId,
    ),

    index("tcn_taxon_feature_state_idx").on(t.taxonFeatureStateId),
    index("tcn_char_idx").on(t.characterId),
    index("tcn_display_unit_idx").on(t.displayUnitId),

    foreignKey({
      name: "tcn_taxon_feature_state_pair_fk",
      columns: [t.taxonFeatureStateId, t.featureId],
      foreignColumns: [taxonFeatureState.id, taxonFeatureState.featureId],
    }),
    // Ensure this state references an existing (character, feature) pairing
    foreignKey({
      name: "tcn_character_feature_fk",
      columns: [t.characterId, t.featureId],
      foreignColumns: [
        characterFeature.characterId,
        characterFeature.featureId,
      ],
    }),
  ],
);

export const taxonCharacterStateRange = pgTable(
  "taxon_character_state_number_range",
  withTimestamps({
    id: serial("id").primaryKey(),

    taxonFeatureStateId: integer("taxon_feature_state_id")
      .notNull()
      .references(() => taxonFeatureState.id, { onDelete: "cascade" }),

    characterId: integer("character_id")
      .notNull()
      .references(() => numericCharacterMeta.characterId, {
        onDelete: "restrict",
      }),

    siBaseMin: numeric("si_base_min", { precision: 30, scale: 18 }),
    siBaseMax: numeric("si_base_max", { precision: 30, scale: 18 }),

    displayUnitId: integer("display_unit_id").references(() => unit.id, {
      onDelete: "restrict",
    }),

    // STORED FEATURE ID - MUST MATCH TAXON FEATURE + CHARACTER FEATURE
    featureId: integer("feature_id").notNull(),
  }),
  (t) => [
    index("tcnr_feature_state_char_idx").on(
      t.taxonFeatureStateId,
      t.characterId,
    ),

    check(
      "tcnr_bounds_ck",
      sql`(${t.siBaseMin} IS NOT NULL OR ${t.siBaseMax} IS NOT NULL)
          AND (${t.siBaseMin} IS NULL OR ${t.siBaseMax} IS NULL OR ${t.siBaseMin} <= ${t.siBaseMax})`,
    ),

    index("tcnr_feature_state_idx").on(t.taxonFeatureStateId),
    index("tcnr_char_idx").on(t.characterId),
    index("tcnr_display_unit_idx").on(t.displayUnitId),

    foreignKey({
      name: "tcnr_taxon_feature_state_pair_fk",
      columns: [t.taxonFeatureStateId, t.featureId],
      foreignColumns: [taxonFeatureState.id, taxonFeatureState.featureId],
    }),
    // Ensure this state references an existing (character, feature) pairing
    foreignKey({
      name: "tcnr_character_feature_fk",
      columns: [t.characterId, t.featureId],
      foreignColumns: [
        characterFeature.characterId,
        characterFeature.featureId,
      ],
    }),
  ],
);
