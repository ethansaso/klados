CREATE TYPE "public"."key_status" AS ENUM('unapproved', 'pending', 'approved');--> statement-breakpoint
ALTER TABLE "dichotomous_key" ADD COLUMN "status" "key_status" DEFAULT 'unapproved' NOT NULL;--> statement-breakpoint
ALTER TABLE "dichotomous_key" ADD COLUMN "author_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "dichotomous_key" ADD COLUMN "tree" jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "categorical_trait_value" ADD CONSTRAINT "trait_values_description_canonical_ck" CHECK (CASE WHEN "categorical_trait_value"."is_canonical" THEN TRUE
    ELSE "categorical_trait_value"."description" = '' END);