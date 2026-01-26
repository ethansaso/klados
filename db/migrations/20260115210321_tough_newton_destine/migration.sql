ALTER TABLE "dichotomous_key" RENAME TO "guide";--> statement-breakpoint
ALTER INDEX "dichotomous_key_root_taxon_idx" RENAME TO "guide_root_taxon_idx";--> statement-breakpoint
ALTER INDEX "dichotomous_key_root_name_uq" RENAME TO "guide_root_name_uq";--> statement-breakpoint
ALTER TYPE "key_status" RENAME TO "guide_status";
ALTER TABLE "guide" ALTER COLUMN "status" SET DATA TYPE guide_status USING "status"::guide_status;--> statement-breakpoint
DROP INDEX "trait_values_canonical_target_idx";--> statement-breakpoint
CREATE INDEX "trait_values_canonical_target_idx" ON "categorical_trait_value" ("canonical_value_id") WHERE "canonical_value_id" IS NOT NULL;--> statement-breakpoint
DROP INDEX "taxon_flag_one_open_per_user_taxon_idx";--> statement-breakpoint
CREATE UNIQUE INDEX "taxon_flag_one_open_per_user_taxon_idx" ON "taxon_flag" ("created_by_user_id","taxon_id") WHERE "status" IN ('open', 'acknowledged');--> statement-breakpoint
DROP INDEX "user_flag_one_open_per_user_profile_idx";--> statement-breakpoint
CREATE UNIQUE INDEX "user_flag_one_open_per_user_profile_idx" ON "user_flag" ("created_by_user_id","flagged_user_id") WHERE "status" IN ('open', 'acknowledged');--> statement-breakpoint
DROP INDEX "source_isbn_uq";--> statement-breakpoint
CREATE UNIQUE INDEX "source_isbn_uq" ON "source" ("isbn") WHERE "isbn" IS NOT NULL;--> statement-breakpoint
DROP INDEX "source_url_uq";--> statement-breakpoint
CREATE UNIQUE INDEX "source_url_uq" ON "source" ("url") WHERE "url" IS NOT NULL;--> statement-breakpoint
DROP INDEX "names_sci_accepted_idx";--> statement-breakpoint
CREATE INDEX "names_sci_accepted_idx" ON "taxon_name" ("taxon_id") WHERE "locale" = 'sci' AND "is_preferred" = true;--> statement-breakpoint
DROP INDEX "names_accepted_scientific_uq";--> statement-breakpoint
CREATE UNIQUE INDEX "names_accepted_scientific_uq" ON "taxon_name" ("taxon_id") WHERE "locale" = 'sci' AND "is_preferred" = true;--> statement-breakpoint
DROP INDEX "names_preferred_per_locale_uq";--> statement-breakpoint
CREATE UNIQUE INDEX "names_preferred_per_locale_uq" ON "taxon_name" ("taxon_id","locale") WHERE "is_preferred" = true;--> statement-breakpoint
DROP INDEX "taxa_source_gbif_uq";--> statement-breakpoint
CREATE UNIQUE INDEX "taxa_source_gbif_uq" ON "taxon" ("source_gbif_id") WHERE "source_gbif_id" IS NOT NULL;--> statement-breakpoint
DROP INDEX "taxa_source_inat_uq";--> statement-breakpoint
CREATE UNIQUE INDEX "taxa_source_inat_uq" ON "taxon" ("source_inat_id") WHERE "source_inat_id" IS NOT NULL;--> statement-breakpoint
ALTER TABLE "categorical_trait_value" DROP CONSTRAINT "trait_values_role_consistency_ck", ADD CONSTRAINT "trait_values_role_consistency_ck" CHECK (CASE WHEN "is_canonical" THEN "canonical_value_id" IS NULL
        ELSE "canonical_value_id" IS NOT NULL END);--> statement-breakpoint
ALTER TABLE "categorical_trait_value" DROP CONSTRAINT "trait_values_no_self_alias_ck", ADD CONSTRAINT "trait_values_no_self_alias_ck" CHECK ("canonical_value_id" IS NULL OR "canonical_value_id" <> "id");--> statement-breakpoint
ALTER TABLE "categorical_trait_value" DROP CONSTRAINT "trait_values_hex_code_format_ck", ADD CONSTRAINT "trait_values_hex_code_format_ck" CHECK ("hex_code" IS NULL OR "hex_code" ~ '^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$');--> statement-breakpoint
ALTER TABLE "categorical_trait_value" DROP CONSTRAINT "trait_values_hex_code_canonical_ck", ADD CONSTRAINT "trait_values_hex_code_canonical_ck" CHECK (CASE WHEN "is_canonical" THEN TRUE
        ELSE "hex_code" IS NULL END);--> statement-breakpoint
ALTER TABLE "categorical_trait_value" DROP CONSTRAINT "trait_values_description_canonical_ck", ADD CONSTRAINT "trait_values_description_canonical_ck" CHECK (CASE WHEN "is_canonical" THEN TRUE
    ELSE "description" = '' END);--> statement-breakpoint
ALTER TABLE "taxon_character_number_range" DROP CONSTRAINT "tcnr_min_le_max_ck", ADD CONSTRAINT "tcnr_min_le_max_ck" CHECK ("si_base_min" <= "si_base_max");--> statement-breakpoint
ALTER TABLE "unit" DROP CONSTRAINT "units_scale_positive_ck", ADD CONSTRAINT "units_scale_positive_ck" CHECK ("scale" > 0);--> statement-breakpoint
ALTER TABLE "source" DROP CONSTRAINT "source_name_not_empty", ADD CONSTRAINT "source_name_not_empty" CHECK (btrim("name") <> '');--> statement-breakpoint
ALTER TABLE "source" DROP CONSTRAINT "source_publication_year_sane", ADD CONSTRAINT "source_publication_year_sane" CHECK ("publication_year" IS NULL OR ("publication_year" >= 1400 AND "publication_year" <= 2500));--> statement-breakpoint
ALTER TABLE "taxon_source" DROP CONSTRAINT "taxon_source_locator_trimmed_ck", ADD CONSTRAINT "taxon_source_locator_trimmed_ck" CHECK ("locator" = '' OR btrim("locator") <> '');--> statement-breakpoint
ALTER TABLE "taxon_name" DROP CONSTRAINT "names_locale_not_empty", ADD CONSTRAINT "names_locale_not_empty" CHECK (btrim("locale") <> '');--> statement-breakpoint
ALTER TABLE "taxon" DROP CONSTRAINT "taxa_parent_not_self", ADD CONSTRAINT "taxa_parent_not_self" CHECK ("parent_id" IS NULL OR "parent_id" <> "id");