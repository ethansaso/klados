ALTER TABLE "categorical_trait_value" DROP CONSTRAINT "canonical_value_id_fk";
--> statement-breakpoint
DROP INDEX "tcv_cat_unique";--> statement-breakpoint
DROP INDEX "tcv_cat_taxon_idx";--> statement-breakpoint
DROP INDEX "tcv_cat_character_idx";--> statement-breakpoint
DROP INDEX "tcv_cat_trait_idx";--> statement-breakpoint
DROP INDEX "trait_values_canonical_target_idx";--> statement-breakpoint
ALTER TABLE "categorical_trait_value" ADD CONSTRAINT "canonical_value_same_set_fk" FOREIGN KEY ("set_id","canonical_value_id") REFERENCES "public"."categorical_trait_value"("set_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "trait_values_set_id_id_uq" ON "categorical_trait_value" USING btree ("set_id","id");--> statement-breakpoint
CREATE UNIQUE INDEX "tcs_cat_unique" ON "taxon_character_state_categorical" USING btree ("taxon_id","character_id","trait_value_id");--> statement-breakpoint
CREATE INDEX "tcs_cat_taxon_idx" ON "taxon_character_state_categorical" USING btree ("taxon_id");--> statement-breakpoint
CREATE INDEX "tcs_cat_character_idx" ON "taxon_character_state_categorical" USING btree ("character_id");--> statement-breakpoint
CREATE INDEX "tcs_cat_trait_idx" ON "taxon_character_state_categorical" USING btree ("trait_value_id");--> statement-breakpoint
CREATE INDEX "tcs_cat_character_trait_idx" ON "taxon_character_state_categorical" USING btree ("character_id","trait_value_id");--> statement-breakpoint
CREATE INDEX "trait_values_canonical_target_idx" ON "categorical_trait_value" USING btree ("canonical_value_id") WHERE "categorical_trait_value"."canonical_value_id" IS NOT NULL;