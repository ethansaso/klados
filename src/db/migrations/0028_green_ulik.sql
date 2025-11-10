ALTER TABLE "categorical_trait_sets" RENAME TO "categorical_trait_set";--> statement-breakpoint
ALTER TABLE "categorical_trait_values" RENAME TO "categorical_trait_value";--> statement-breakpoint
ALTER TABLE "characters" RENAME TO "character";--> statement-breakpoint
ALTER TABLE "character_groups" RENAME TO "character_group";--> statement-breakpoint
ALTER TABLE "character_value_categorical" RENAME TO "taxon_character_state_categorical";--> statement-breakpoint
ALTER TABLE "names" RENAME TO "taxon_name";--> statement-breakpoint
ALTER TABLE "taxa" RENAME TO "taxon";--> statement-breakpoint
ALTER TABLE "categorical_trait_value" DROP CONSTRAINT "trait_values_role_consistency_ck";--> statement-breakpoint
ALTER TABLE "categorical_trait_value" DROP CONSTRAINT "trait_values_no_self_alias_ck";--> statement-breakpoint
ALTER TABLE "taxon_name" DROP CONSTRAINT "names_kind_field_rules";--> statement-breakpoint
ALTER TABLE "taxon" DROP CONSTRAINT "taxa_parent_not_self";--> statement-breakpoint
ALTER TABLE "categorical_trait_value" DROP CONSTRAINT "categorical_trait_values_set_id_categorical_trait_sets_id_fk";
--> statement-breakpoint
ALTER TABLE "categorical_trait_value" DROP CONSTRAINT "canonical_value_id_fk";
--> statement-breakpoint
ALTER TABLE "categorical_character_meta" DROP CONSTRAINT "categorical_character_meta_character_id_characters_id_fk";
--> statement-breakpoint
ALTER TABLE "categorical_character_meta" DROP CONSTRAINT "categorical_character_meta_trait_set_id_categorical_trait_sets_id_fk";
--> statement-breakpoint
ALTER TABLE "character" DROP CONSTRAINT "characters_group_id_character_groups_id_fk";
--> statement-breakpoint
ALTER TABLE "taxon_character_state_categorical" DROP CONSTRAINT "character_value_categorical_taxon_id_taxa_id_fk";
--> statement-breakpoint
ALTER TABLE "taxon_character_state_categorical" DROP CONSTRAINT "character_value_categorical_character_id_characters_id_fk";
--> statement-breakpoint
ALTER TABLE "taxon_character_state_categorical" DROP CONSTRAINT "character_value_categorical_trait_value_id_categorical_trait_values_id_fk";
--> statement-breakpoint
ALTER TABLE "taxon_name" DROP CONSTRAINT "names_taxon_id_taxa_id_fk";
--> statement-breakpoint
ALTER TABLE "taxon" DROP CONSTRAINT "taxa_parent_fk";
--> statement-breakpoint
ALTER TABLE "taxon" DROP CONSTRAINT "taxa_replaced_by_fk";
--> statement-breakpoint
DROP INDEX "names_sci_accepted_idx";--> statement-breakpoint
DROP INDEX "names_accepted_scientific_uq";--> statement-breakpoint
DROP INDEX "names_preferred_common_uq";--> statement-breakpoint
DROP INDEX "taxa_source_gbif_uq";--> statement-breakpoint
DROP INDEX "taxa_source_inat_uq";--> statement-breakpoint
ALTER TABLE "categorical_character_meta" ALTER COLUMN "is_multi_select" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "categorical_trait_value" ADD CONSTRAINT "categorical_trait_value_set_id_categorical_trait_set_id_fk" FOREIGN KEY ("set_id") REFERENCES "public"."categorical_trait_set"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "categorical_trait_value" ADD CONSTRAINT "canonical_value_id_fk" FOREIGN KEY ("canonical_value_id") REFERENCES "public"."categorical_trait_value"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "categorical_character_meta" ADD CONSTRAINT "categorical_character_meta_character_id_character_id_fk" FOREIGN KEY ("character_id") REFERENCES "public"."character"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "categorical_character_meta" ADD CONSTRAINT "categorical_character_meta_trait_set_id_categorical_trait_set_id_fk" FOREIGN KEY ("trait_set_id") REFERENCES "public"."categorical_trait_set"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "character" ADD CONSTRAINT "character_group_id_character_group_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."character_group"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "taxon_character_state_categorical" ADD CONSTRAINT "taxon_character_state_categorical_taxon_id_taxon_id_fk" FOREIGN KEY ("taxon_id") REFERENCES "public"."taxon"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "taxon_character_state_categorical" ADD CONSTRAINT "taxon_character_state_categorical_character_id_character_id_fk" FOREIGN KEY ("character_id") REFERENCES "public"."character"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "taxon_character_state_categorical" ADD CONSTRAINT "taxon_character_state_categorical_trait_value_id_categorical_trait_value_id_fk" FOREIGN KEY ("trait_value_id") REFERENCES "public"."categorical_trait_value"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "taxon_name" ADD CONSTRAINT "taxon_name_taxon_id_taxon_id_fk" FOREIGN KEY ("taxon_id") REFERENCES "public"."taxon"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "taxon" ADD CONSTRAINT "taxa_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."taxon"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "taxon" ADD CONSTRAINT "taxa_replaced_by_fk" FOREIGN KEY ("replaced_by_id") REFERENCES "public"."taxon"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "names_sci_accepted_idx" ON "taxon_name" USING btree ("taxon_id") WHERE "taxon_name"."kind" = 'scientific' AND "taxon_name"."synonym_kind" IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "names_accepted_scientific_uq" ON "taxon_name" USING btree ("taxon_id") WHERE "taxon_name"."kind" = 'scientific' AND "taxon_name"."synonym_kind" IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "names_preferred_common_uq" ON "taxon_name" USING btree ("taxon_id","locale") WHERE "taxon_name"."kind" = 'common' AND "taxon_name"."is_preferred" = true;--> statement-breakpoint
CREATE UNIQUE INDEX "taxa_source_gbif_uq" ON "taxon" USING btree ("source_gbif_id") WHERE "taxon"."source_gbif_id" IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "taxa_source_inat_uq" ON "taxon" USING btree ("source_inat_id") WHERE "taxon"."source_inat_id" IS NOT NULL;--> statement-breakpoint
ALTER TABLE "categorical_trait_value" ADD CONSTRAINT "trait_values_role_consistency_ck" CHECK (CASE WHEN "categorical_trait_value"."is_canonical" THEN "categorical_trait_value"."canonical_value_id" IS NULL
        ELSE "categorical_trait_value"."canonical_value_id" IS NOT NULL END);--> statement-breakpoint
ALTER TABLE "categorical_trait_value" ADD CONSTRAINT "trait_values_no_self_alias_ck" CHECK ("categorical_trait_value"."canonical_value_id" IS NULL OR "categorical_trait_value"."canonical_value_id" <> "categorical_trait_value"."id");--> statement-breakpoint
ALTER TABLE "taxon_name" ADD CONSTRAINT "names_kind_field_rules" CHECK (
        ("taxon_name"."kind" = 'common' AND "taxon_name"."locale" IS NOT NULL AND "taxon_name"."synonym_kind" IS NULL)
        OR
        ("taxon_name"."kind" = 'scientific' AND "taxon_name"."locale" IS NULL AND "taxon_name"."is_preferred" = false)
      );--> statement-breakpoint
ALTER TABLE "taxon" ADD CONSTRAINT "taxa_parent_not_self" CHECK ("taxon"."parent_id" IS NULL OR "taxon"."parent_id" <> "taxon"."id");