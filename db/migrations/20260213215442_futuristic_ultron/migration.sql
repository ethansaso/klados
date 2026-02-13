CREATE TABLE "character_feature" (
	"character_id" integer,
	"feature_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "character_feature_pkey" PRIMARY KEY("character_id","feature_id")
);
--> statement-breakpoint
ALTER TABLE "character_group" RENAME TO "feature";--> statement-breakpoint
ALTER TABLE "taxon_character_number" RENAME TO "taxon_character_state_number";--> statement-breakpoint
ALTER TABLE "taxon_character_number_range" RENAME TO "taxon_character_state_number_range";--> statement-breakpoint
ALTER TABLE "taxon_character_group_state" RENAME TO "taxon_feature_state";--> statement-breakpoint
ALTER TABLE "categorical_trait_value" DROP CONSTRAINT "categorical_trait_value_set_id_categorical_trait_set_id_fk";--> statement-breakpoint
ALTER TABLE "categorical_trait_value" DROP CONSTRAINT "canonical_value_same_set_fk";--> statement-breakpoint
ALTER TABLE "categorical_character_meta" DROP CONSTRAINT "categorical_character_meta_trait_set_id_categorical_trait_set_i";--> statement-breakpoint
ALTER TABLE "character" DROP CONSTRAINT "character_group_id_character_group_id_fk";--> statement-breakpoint
DROP TABLE "categorical_trait_set";--> statement-breakpoint
ALTER TABLE "taxon_character_state_categorical" RENAME COLUMN "taxon_group_state_id" TO "taxon_feature_state_id";--> statement-breakpoint
ALTER TABLE "taxon_character_state_categorical" RENAME COLUMN "group_id" TO "feature_id";--> statement-breakpoint
ALTER TABLE "taxon_character_state_number" RENAME COLUMN "taxon_group_state_id" TO "taxon_feature_state_id";--> statement-breakpoint
ALTER TABLE "taxon_character_state_number" RENAME COLUMN "group_id" TO "feature_id";--> statement-breakpoint
ALTER TABLE "taxon_character_state_number_range" RENAME COLUMN "taxon_group_state_id" TO "taxon_feature_state_id";--> statement-breakpoint
ALTER TABLE "taxon_character_state_number_range" RENAME COLUMN "group_id" TO "feature_id";--> statement-breakpoint
ALTER TABLE "taxon_feature_state" RENAME COLUMN "group_id" TO "feature_id";--> statement-breakpoint
ALTER TABLE "categorical_trait_value" DROP CONSTRAINT "trait_values_set_id_id_uq";--> statement-breakpoint
ALTER INDEX "character_groups_key_uq" RENAME TO "feature_key_uq";--> statement-breakpoint
ALTER INDEX "tcs_cat_taxon_group_state_idx" RENAME TO "tcs_cat_taxon_feature_state_idx";--> statement-breakpoint
ALTER INDEX "tcn_group_state_char_uq" RENAME TO "tcn_feature_state_char_uq";--> statement-breakpoint
ALTER INDEX "tcn_taxon_group_state_idx" RENAME TO "tcn_taxon_feature_state_idx";--> statement-breakpoint
ALTER INDEX "tcnr_group_state_char_uq" RENAME TO "tcnr_feature_state_char_uq";--> statement-breakpoint
ALTER INDEX "tcnr_group_state_idx" RENAME TO "tcnr_feature_state_idx";--> statement-breakpoint
ALTER INDEX "taxon_character_group_state_taxon_group_uq" RENAME TO "taxon_feature_state_taxon_feature_uq";--> statement-breakpoint
ALTER INDEX "taxon_character_group_state_id_group_uq" RENAME TO "taxon_feature_state_id_feature_uq";--> statement-breakpoint
ALTER INDEX "taxon_character_group_state_taxon_idx" RENAME TO "taxon_feature_state_taxon_idx";--> statement-breakpoint
ALTER INDEX "taxon_character_group_state_group_idx" RENAME TO "taxon_feature_state_feature_idx";--> statement-breakpoint
DROP INDEX "trait_values_set_key_uq";--> statement-breakpoint
DROP INDEX "trait_values_set_idx";--> statement-breakpoint
DROP INDEX "characters_group_idx";--> statement-breakpoint
ALTER TABLE "taxon_character_state_categorical" RENAME CONSTRAINT "tcs_cat_taxon_group_state_pair_fk" TO "tcs_cat_taxon_feature_state_pair_fk";--> statement-breakpoint
ALTER TABLE "taxon_character_state_categorical" RENAME CONSTRAINT "tcs_cat_character_group_fk" TO "tcs_cat_character_feature_fk";--> statement-breakpoint
ALTER TABLE "taxon_character_state_number" RENAME CONSTRAINT "tcn_taxon_group_state_pair_fk" TO "tcn_taxon_feature_state_pair_fk";--> statement-breakpoint
ALTER TABLE "taxon_character_state_number" RENAME CONSTRAINT "tcn_character_group_fk" TO "tcn_character_feature_fk";--> statement-breakpoint
ALTER TABLE "taxon_character_state_number_range" RENAME CONSTRAINT "tcnr_taxon_group_state_pair_fk" TO "tcnr_taxon_feature_state_pair_fk";--> statement-breakpoint
ALTER TABLE "taxon_character_state_number_range" RENAME CONSTRAINT "tcnr_character_group_fk" TO "tcnr_character_feature_fk";--> statement-breakpoint

-- ! DESTRUCTIVE but necessary truncation, since m:1:m, etc. relationships are being collapsed into 1:m, etc. & no clean way to preserve data w/o duplicating. Prod data irrelevant at time of change (2/13/26)
-- Eliminate rows in trait value table
TRUNCATE TABLE "categorical_trait_value" CASCADE;
-- Eliminate rows in state tables
TRUNCATE TABLE "taxon_character_state_categorical" CASCADE;
TRUNCATE TABLE "taxon_character_state_number" CASCADE;
TRUNCATE TABLE "taxon_character_state_number_range" CASCADE;
TRUNCATE TABLE "taxon_feature_state" CASCADE;

ALTER TABLE "feature" ADD COLUMN "parent_id" integer;--> statement-breakpoint
ALTER TABLE "categorical_trait_value" ADD COLUMN "character_id" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "categorical_trait_value" DROP COLUMN "set_id";--> statement-breakpoint
ALTER TABLE "categorical_character_meta" DROP COLUMN "trait_set_id";--> statement-breakpoint
ALTER TABLE "categorical_trait_value" ADD CONSTRAINT "trait_values_character_id_id_uq" UNIQUE("character_id","id");--> statement-breakpoint
CREATE INDEX "character_feature_character_idx" ON "character_feature" ("character_id");--> statement-breakpoint
CREATE INDEX "character_feature_feature_idx" ON "character_feature" ("feature_id");--> statement-breakpoint
CREATE INDEX "feature_parent_idx" ON "feature" ("parent_id");--> statement-breakpoint
CREATE UNIQUE INDEX "trait_values_character_key_uq" ON "categorical_trait_value" ("character_id","key");--> statement-breakpoint
CREATE INDEX "trait_values_character_idx" ON "categorical_trait_value" ("character_id");--> statement-breakpoint
ALTER TABLE "character_feature" ADD CONSTRAINT "character_feature_character_id_character_id_fkey" FOREIGN KEY ("character_id") REFERENCES "character"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "character_feature" ADD CONSTRAINT "character_feature_feature_id_feature_id_fkey" FOREIGN KEY ("feature_id") REFERENCES "feature"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "feature" ADD CONSTRAINT "feature_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "feature"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "categorical_trait_value" ADD CONSTRAINT "categorical_trait_value_L8geKddQIVF0_fkey" FOREIGN KEY ("character_id") REFERENCES "categorical_character_meta"("character_id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "categorical_trait_value" ADD CONSTRAINT "canonical_value_same_character_fk" FOREIGN KEY ("character_id","canonical_value_id") REFERENCES "categorical_trait_value"("character_id","id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "taxon_character_state_categorical" ADD CONSTRAINT "tcs_cat_character_trait_same_character_fk" FOREIGN KEY ("character_id","trait_value_id") REFERENCES "categorical_trait_value"("character_id","id");--> statement-breakpoint
ALTER TABLE "taxon_character_state_categorical" DROP CONSTRAINT "tcs_cat_character_feature_fk", ADD CONSTRAINT "tcs_cat_character_feature_fk" FOREIGN KEY ("character_id","feature_id") REFERENCES "character_feature"("character_id","feature_id");--> statement-breakpoint
ALTER TABLE "taxon_character_state_number" DROP CONSTRAINT "tcn_character_feature_fk", ADD CONSTRAINT "tcn_character_feature_fk" FOREIGN KEY ("character_id","feature_id") REFERENCES "character_feature"("character_id","feature_id");--> statement-breakpoint
ALTER TABLE "taxon_character_state_number_range" DROP CONSTRAINT "tcnr_character_feature_fk", ADD CONSTRAINT "tcnr_character_feature_fk" FOREIGN KEY ("character_id","feature_id") REFERENCES "character_feature"("character_id","feature_id");--> statement-breakpoint
ALTER TABLE "categorical_trait_value" DROP CONSTRAINT "trait_values_description_canonical_ck", ADD CONSTRAINT "trait_values_description_canonical_ck" CHECK (CASE WHEN "is_canonical" THEN TRUE
        ELSE "description" = '' END);

-- Drop uniqueness constraint (no longer necessary to ensure traits/characters/groups belong to the correct respective parents)
ALTER TABLE "character" DROP CONSTRAINT "character_id_group_uq";--> statement-breakpoint
-- Drop group_id column (now uses a join table)
ALTER TABLE "character" DROP COLUMN "group_id";--> statement-breakpoint