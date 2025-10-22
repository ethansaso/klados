CREATE TYPE "public"."taxon_status" AS ENUM('draft', 'active', 'deprecated');--> statement-breakpoint
DROP INDEX "names_value_trgm_idx";--> statement-breakpoint
ALTER TABLE "taxa" ADD COLUMN "status" "taxon_status" DEFAULT 'draft' NOT NULL;--> statement-breakpoint
CREATE INDEX "names_sci_accepted_idx" ON "names" USING btree ("taxon_id") WHERE "names"."kind" = 'scientific' AND "names"."synonym_kind" IS NULL;--> statement-breakpoint
CREATE INDEX "names_value_trgm_lower_idx" ON "names" USING gin (lower("value") gin_trgm_ops);