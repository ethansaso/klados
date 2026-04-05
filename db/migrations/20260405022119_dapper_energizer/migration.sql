ALTER TABLE "taxon_character_state_number_range" DROP CONSTRAINT "tcnr_min_le_max_ck";--> statement-breakpoint
ALTER TABLE "taxon_character_state_number_range" ALTER COLUMN "si_base_min" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "taxon_character_state_number_range" ALTER COLUMN "si_base_max" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "taxon_character_state_number_range" ADD CONSTRAINT "tcnr_bounds_ck" CHECK (("si_base_min" IS NOT NULL OR "si_base_max" IS NOT NULL)
          AND ("si_base_min" IS NULL OR "si_base_max" IS NULL OR "si_base_min" <= "si_base_max"));