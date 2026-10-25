CREATE TYPE "feature_semantics" AS ENUM('explicit', 'variant', 'assumed');--> statement-breakpoint
-- Default only backfills existing rows; new rows must set semantics explicitly
ALTER TABLE "feature" ADD COLUMN "semantics" "feature_semantics" DEFAULT 'explicit' NOT NULL;--> statement-breakpoint
ALTER TABLE "feature" ALTER COLUMN "semantics" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "feature" ADD CONSTRAINT "feature_variant_has_parent_ck" CHECK ("semantics" <> 'variant' OR "parent_id" IS NOT NULL);
