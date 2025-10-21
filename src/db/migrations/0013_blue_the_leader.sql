DROP INDEX "taxa_gbif_idx";--> statement-breakpoint
DROP INDEX "taxa_inat_idx";--> statement-breakpoint
CREATE UNIQUE INDEX "taxa_source_gbif_uq" ON "taxa" USING btree ("source_gbif_id") WHERE "taxa"."source_gbif_id" IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "taxa_source_inat_uq" ON "taxa" USING btree ("source_inat_id") WHERE "taxa"."source_inat_id" IS NOT NULL;