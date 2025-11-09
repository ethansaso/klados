ALTER TABLE "categorical_option_sets" RENAME TO "categorical_trait_sets";--> statement-breakpoint
ALTER TABLE "categorical_option_values" RENAME TO "categorical_trait_values";--> statement-breakpoint
ALTER TABLE "character_categorical_meta" RENAME TO "categorical_character_meta";--> statement-breakpoint
ALTER TABLE "categorical_character_meta" RENAME COLUMN "option_set_id" TO "trait_set_id";--> statement-breakpoint
ALTER TABLE "character_value_categorical" RENAME COLUMN "option_value_id" TO "trait_value_id";--> statement-breakpoint
ALTER TABLE "categorical_trait_values" DROP CONSTRAINT "option_values_role_consistency_ck";--> statement-breakpoint
ALTER TABLE "categorical_trait_values" DROP CONSTRAINT "option_values_no_self_alias_ck";--> statement-breakpoint
ALTER TABLE "categorical_trait_values" DROP CONSTRAINT "categorical_option_values_set_id_categorical_option_sets_id_fk";
--> statement-breakpoint
ALTER TABLE "categorical_trait_values" DROP CONSTRAINT "canonical_value_id_fk";
--> statement-breakpoint
ALTER TABLE "categorical_character_meta" DROP CONSTRAINT "character_categorical_meta_character_id_characters_id_fk";
--> statement-breakpoint
ALTER TABLE "categorical_character_meta" DROP CONSTRAINT "character_categorical_meta_option_set_id_categorical_option_sets_id_fk";
--> statement-breakpoint
ALTER TABLE "character_value_categorical" DROP CONSTRAINT "character_value_categorical_option_value_id_categorical_option_values_id_fk";
--> statement-breakpoint
DROP INDEX "option_sets_key_uq";--> statement-breakpoint
DROP INDEX "option_values_set_key_uq";--> statement-breakpoint
DROP INDEX "option_values_set_idx";--> statement-breakpoint
DROP INDEX "option_values_canonical_target_idx";--> statement-breakpoint
DROP INDEX "tcv_cat_option_idx";--> statement-breakpoint
DROP INDEX "tcv_cat_unique";--> statement-breakpoint
ALTER TABLE "categorical_trait_values" ADD CONSTRAINT "categorical_trait_values_set_id_categorical_trait_sets_id_fk" FOREIGN KEY ("set_id") REFERENCES "public"."categorical_trait_sets"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "categorical_trait_values" ADD CONSTRAINT "canonical_value_id_fk" FOREIGN KEY ("canonical_value_id") REFERENCES "public"."categorical_trait_values"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "categorical_character_meta" ADD CONSTRAINT "categorical_character_meta_character_id_characters_id_fk" FOREIGN KEY ("character_id") REFERENCES "public"."characters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "categorical_character_meta" ADD CONSTRAINT "categorical_character_meta_trait_set_id_categorical_trait_sets_id_fk" FOREIGN KEY ("trait_set_id") REFERENCES "public"."categorical_trait_sets"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "character_value_categorical" ADD CONSTRAINT "character_value_categorical_trait_value_id_categorical_trait_values_id_fk" FOREIGN KEY ("trait_value_id") REFERENCES "public"."categorical_trait_values"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "trait_sets_key_uq" ON "categorical_trait_sets" USING btree ("key");--> statement-breakpoint
CREATE UNIQUE INDEX "trait_values_set_key_uq" ON "categorical_trait_values" USING btree ("set_id","key");--> statement-breakpoint
CREATE INDEX "trait_values_set_idx" ON "categorical_trait_values" USING btree ("set_id");--> statement-breakpoint
CREATE INDEX "trait_values_canonical_target_idx" ON "categorical_trait_values" USING btree ("canonical_value_id");--> statement-breakpoint
CREATE INDEX "tcv_cat_trait_idx" ON "character_value_categorical" USING btree ("trait_value_id");--> statement-breakpoint
CREATE UNIQUE INDEX "tcv_cat_unique" ON "character_value_categorical" USING btree ("taxon_id","character_id","trait_value_id");--> statement-breakpoint
ALTER TABLE "categorical_trait_values" ADD CONSTRAINT "trait_values_role_consistency_ck" CHECK (CASE WHEN "categorical_trait_values"."is_canonical" THEN "categorical_trait_values"."canonical_value_id" IS NULL
        ELSE "categorical_trait_values"."canonical_value_id" IS NOT NULL END);--> statement-breakpoint
ALTER TABLE "categorical_trait_values" ADD CONSTRAINT "trait_values_no_self_alias_ck" CHECK ("categorical_trait_values"."canonical_value_id" IS NULL OR "categorical_trait_values"."canonical_value_id" <> "categorical_trait_values"."id");