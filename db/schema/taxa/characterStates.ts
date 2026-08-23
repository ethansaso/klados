import { sql } from "drizzle-orm";
import {
  check,
  foreignKey,
  index,
  integer,
  numeric,
  pgTable,
  serial,
} from "drizzle-orm/pg-core";
import { numrange } from "../../utils/numrange";
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

    // STORED SYNONYM SET - MUST MATCH THE TRAIT VALUE'S SET
    synonymSetId: integer("synonym_set_id").notNull(),
  }),
  (t) => [
    index("tcs_cat_feature_state_char_trait_idx").on(
      t.taxonFeatureStateId,
      t.characterId,
      t.traitValueId,
    ),

    index("tcs_cat_taxon_feature_state_idx").on(t.taxonFeatureStateId),
    index("tcs_cat_character_idx").on(t.characterId),
    index("tcs_cat_trait_idx").on(t.traitValueId),
    index("tcs_cat_character_trait_idx").on(t.characterId, t.traitValueId),
    index("tcs_cat_char_set_idx").on(t.characterId, t.synonymSetId),

    // Enforce taxonFeatureState <-> featureId consistency, and that feature is present
    foreignKey({
      name: "tcs_cat_taxon_feature_state_pair_fk",
      columns: [t.taxonFeatureStateId, t.featureId],
      foreignColumns: [
        taxonFeatureState.characterizableId,
        taxonFeatureState.featureId,
      ],
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

    // CASCADEing reference to denormalized synonymSetId
    foreignKey({
      name: "tcs_cat_trait_synonym_set_fk",
      columns: [t.characterId, t.traitValueId, t.synonymSetId],
      foreignColumns: [
        categoricalTraitValue.characterId,
        categoricalTraitValue.id,
        categoricalTraitValue.synonymSetId,
      ],
    }).onUpdate("cascade"),
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

    // `mode: "number"` keeps the TS type a number while the column stays exact
    // decimal, so a bound entered as "5 cm" is stored as exactly 0.05 and a
    // search for 5 cm matches it. Binary floats can land a bit apart here.
    siBaseValue: numeric("si_base_value", {
      precision: 30,
      scale: 18,
      mode: "number",
    }).notNull(),

    displayUnitId: integer("display_unit_id").references(() => unit.id, {
      onDelete: "restrict",
    }),

    // Matching column with taxonCharacterStateRange -- generated
    // to accelerate value gist index
    valueRange: numrange("value_range").generatedAlwaysAs(
      sql`numrange(si_base_value, si_base_value, '[]')`,
    ),

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
    index("tcn_value_range_idx").using("gist", t.valueRange),

    // Enforce taxonFeatureState <-> featureId consistency, and that feature is present
    foreignKey({
      name: "tcn_taxon_feature_state_pair_fk",
      columns: [t.taxonFeatureStateId, t.featureId],
      foreignColumns: [
        taxonFeatureState.characterizableId,
        taxonFeatureState.featureId,
      ],
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

    siBaseMin: numeric("si_base_min", {
      precision: 30,
      scale: 18,
      mode: "number",
    }),
    siBaseMax: numeric("si_base_max", {
      precision: 30,
      scale: 18,
      mode: "number",
    }),

    displayUnitId: integer("display_unit_id").references(() => unit.id, {
      onDelete: "restrict",
    }),

    // Matches taxonCharacterStateNumber; note NULL will be unbounded
    valueRange: numrange("value_range").generatedAlwaysAs(
      sql`numrange(si_base_min, si_base_max, '[]')`,
    ),

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
    index("tcnr_value_range_idx").using("gist", t.valueRange),

    // Enforce taxonFeatureState <-> featureId consistency, and that
    foreignKey({
      name: "tcnr_taxon_feature_state_pair_fk",
      columns: [t.taxonFeatureStateId, t.featureId],
      foreignColumns: [
        taxonFeatureState.characterizableId,
        taxonFeatureState.featureId,
      ],
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
