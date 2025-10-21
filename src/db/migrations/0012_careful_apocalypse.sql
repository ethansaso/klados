ALTER TABLE "taxa" DROP CONSTRAINT "taxa_parent_id_taxa_id_fk";
--> statement-breakpoint
DROP INDEX "taxa_canonical_idx";--> statement-breakpoint
ALTER TABLE "taxa" ADD COLUMN "source_gbif_id" integer;--> statement-breakpoint
ALTER TABLE "taxa" ADD COLUMN "source_inat_id" integer;--> statement-breakpoint
ALTER TABLE "taxa" ADD COLUMN "media" jsonb;--> statement-breakpoint
ALTER TABLE "taxa" ADD COLUMN "notes" text;--> statement-breakpoint
ALTER TABLE "taxa" ADD CONSTRAINT "taxa_parent_id_taxa_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."taxa"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "taxa_rank_idx" ON "taxa" USING btree ("rank");--> statement-breakpoint
CREATE INDEX "taxa_gbif_idx" ON "taxa" USING btree ("source_gbif_id");--> statement-breakpoint
CREATE INDEX "taxa_inat_idx" ON "taxa" USING btree ("source_inat_id");--> statement-breakpoint
ALTER TABLE "taxa" DROP COLUMN "canonical";--> statement-breakpoint
ALTER TABLE "taxa" ADD CONSTRAINT "taxa_parent_not_self" CHECK ("taxa"."parent_id" IS NULL OR "taxa"."parent_id" <> "taxa"."id");