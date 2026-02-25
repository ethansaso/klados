DROP INDEX "characters_key_uq";--> statement-breakpoint
DROP INDEX "feature_key_uq";--> statement-breakpoint
DROP INDEX "categorical_modifier_groups_key_uq";--> statement-breakpoint
DROP INDEX "trait_values_character_key_uq";--> statement-breakpoint
DROP INDEX "tcs_cat_group_state_char_trait_uq";--> statement-breakpoint
ALTER TABLE "character" DROP COLUMN "key";--> statement-breakpoint
ALTER TABLE "feature" DROP COLUMN "key";--> statement-breakpoint
ALTER TABLE "categorical_modifier_group" DROP COLUMN "key";--> statement-breakpoint
ALTER TABLE "categorical_trait_value" DROP COLUMN "key";--> statement-breakpoint
CREATE UNIQUE INDEX "characters_label_uq" ON "character" ("label");--> statement-breakpoint
CREATE UNIQUE INDEX "feature_label_uq" ON "feature" ("label");--> statement-breakpoint
CREATE UNIQUE INDEX "categorical_modifier_groups_label_uq" ON "categorical_modifier_group" ("label");--> statement-breakpoint
CREATE UNIQUE INDEX "trait_values_character_label_uq" ON "categorical_trait_value" ("character_id","label");--> statement-breakpoint
CREATE UNIQUE INDEX "tcs_cat_feature_state_char_trait_uq" ON "taxon_character_state_categorical" ("taxon_feature_state_id","character_id","trait_value_id");