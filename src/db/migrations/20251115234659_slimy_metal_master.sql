ALTER TABLE "taxon_name" DROP CONSTRAINT "names_kind_field_rules";--> statement-breakpoint
DROP INDEX "names_taxon_kind_idx";--> statement-breakpoint
DROP INDEX "names_preferred_common_uq";--> statement-breakpoint
DROP INDEX "names_sci_accepted_idx";--> statement-breakpoint
DROP INDEX "names_accepted_scientific_uq";--> statement-breakpoint
DROP INDEX "names_value_norm_uq";--> statement-breakpoint
ALTER TABLE "taxon_name" ALTER COLUMN "locale" SET NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "names_preferred_per_locale_uq" ON "taxon_name" USING btree ("taxon_id","locale") WHERE "taxon_name"."is_preferred" = true;--> statement-breakpoint
CREATE INDEX "names_sci_accepted_idx" ON "taxon_name" USING btree ("taxon_id") WHERE "taxon_name"."locale" = 'sci' AND "taxon_name"."is_preferred" = true;--> statement-breakpoint
CREATE UNIQUE INDEX "names_accepted_scientific_uq" ON "taxon_name" USING btree ("taxon_id") WHERE "taxon_name"."locale" = 'sci' AND "taxon_name"."is_preferred" = true;--> statement-breakpoint
CREATE UNIQUE INDEX "names_value_norm_uq" ON "taxon_name" USING btree ("taxon_id",lower(btrim("locale")),lower(btrim("value")));--> statement-breakpoint
ALTER TABLE "taxon_name" DROP COLUMN "kind";--> statement-breakpoint
ALTER TABLE "taxon_name" ADD CONSTRAINT "names_locale_not_empty" CHECK (btrim("taxon_name"."locale") <> '');--> statement-breakpoint
DROP TYPE "public"."name_kind";