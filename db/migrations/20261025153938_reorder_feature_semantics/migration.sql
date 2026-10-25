-- The check constraint compares against the enum, so it has to go while the type is rebuilt
ALTER TABLE "feature" DROP CONSTRAINT "feature_variant_has_parent_ck";--> statement-breakpoint
ALTER TABLE "feature" ALTER COLUMN "semantics" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "feature_semantics";--> statement-breakpoint
CREATE TYPE "feature_semantics" AS ENUM('explicit', 'assumed', 'variant');--> statement-breakpoint
ALTER TABLE "feature" ALTER COLUMN "semantics" SET DATA TYPE "feature_semantics" USING "semantics"::"feature_semantics";--> statement-breakpoint
ALTER TABLE "feature" ADD CONSTRAINT "feature_variant_has_parent_ck" CHECK ("semantics" <> 'variant' OR "parent_id" IS NOT NULL);
