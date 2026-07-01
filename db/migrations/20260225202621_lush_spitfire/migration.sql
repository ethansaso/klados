ALTER TABLE "categorical_trait_value" DROP CONSTRAINT "trait_values_role_consistency_ck";--> statement-breakpoint
ALTER TABLE "categorical_trait_value" DROP COLUMN "is_canonical";--> statement-breakpoint
ALTER TABLE "categorical_trait_value" ADD CONSTRAINT "trait_values_hex_code_canonical_ck" CHECK ("canonical_value_id" IS NULL OR "hex_code" IS NULL);--> statement-breakpoint
ALTER TABLE "categorical_trait_value" ADD CONSTRAINT "trait_values_description_canonical_ck" CHECK ("canonical_value_id" IS NULL OR "description" = '');