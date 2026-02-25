CREATE TABLE "taxon_character_state_modifier_categorical" (
	"id" serial PRIMARY KEY,
	"taxon_character_state_categorical_id" integer NOT NULL,
	"modifier_id" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "taxon_character_state_modifier_number" (
	"id" serial PRIMARY KEY,
	"taxon_character_state_number_id" integer NOT NULL,
	"modifier_id" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "taxon_character_state_modifier_range" (
	"id" serial PRIMARY KEY,
	"taxon_character_state_range_id" integer NOT NULL,
	"modifier_id" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "categorical_modifier_group" ALTER COLUMN "class" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "modifier_type";--> statement-breakpoint
CREATE TYPE "modifier_type" AS ENUM('positional', 'reliability', 'demographic', 'reactive');--> statement-breakpoint
ALTER TABLE "categorical_modifier_group" ALTER COLUMN "class" SET DATA TYPE "modifier_type" USING "class"::"modifier_type";--> statement-breakpoint
CREATE UNIQUE INDEX "tcsmc_state_mod_uq" ON "taxon_character_state_modifier_categorical" ("taxon_character_state_categorical_id","modifier_id");--> statement-breakpoint
CREATE INDEX "tcsmc_state_idx" ON "taxon_character_state_modifier_categorical" ("taxon_character_state_categorical_id");--> statement-breakpoint
CREATE INDEX "tcsmc_mod_idx" ON "taxon_character_state_modifier_categorical" ("modifier_id");--> statement-breakpoint
CREATE UNIQUE INDEX "tcsmn_state_mod_uq" ON "taxon_character_state_modifier_number" ("taxon_character_state_number_id","modifier_id");--> statement-breakpoint
CREATE INDEX "tcsmn_state_idx" ON "taxon_character_state_modifier_number" ("taxon_character_state_number_id");--> statement-breakpoint
CREATE INDEX "tcsmn_mod_idx" ON "taxon_character_state_modifier_number" ("modifier_id");--> statement-breakpoint
CREATE UNIQUE INDEX "tcsmr_state_mod_uq" ON "taxon_character_state_modifier_range" ("taxon_character_state_range_id","modifier_id");--> statement-breakpoint
CREATE INDEX "tcsmr_state_idx" ON "taxon_character_state_modifier_range" ("taxon_character_state_range_id");--> statement-breakpoint
CREATE INDEX "tcsmr_mod_idx" ON "taxon_character_state_modifier_range" ("modifier_id");--> statement-breakpoint
ALTER TABLE "taxon_character_state_modifier_categorical" ADD CONSTRAINT "taxon_character_state_modifier_categorical_RM4PRvs5PYx5_fkey" FOREIGN KEY ("taxon_character_state_categorical_id") REFERENCES "taxon_character_state_categorical"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "taxon_character_state_modifier_categorical" ADD CONSTRAINT "taxon_character_state_modifier_categorical_wK2TWcEBLyaM_fkey" FOREIGN KEY ("modifier_id") REFERENCES "categorical_modifier_value"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "taxon_character_state_modifier_number" ADD CONSTRAINT "taxon_character_state_modifier_number_K9yciL3Osdoc_fkey" FOREIGN KEY ("taxon_character_state_number_id") REFERENCES "taxon_character_state_number"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "taxon_character_state_modifier_number" ADD CONSTRAINT "taxon_character_state_modifier_number_oTdcb6Whoh1J_fkey" FOREIGN KEY ("modifier_id") REFERENCES "categorical_modifier_value"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "taxon_character_state_modifier_range" ADD CONSTRAINT "taxon_character_state_modifier_range_9GivQDJyBbOI_fkey" FOREIGN KEY ("taxon_character_state_range_id") REFERENCES "taxon_character_state_number_range"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "taxon_character_state_modifier_range" ADD CONSTRAINT "taxon_character_state_modifier_range_PGn8kjigc4Bd_fkey" FOREIGN KEY ("modifier_id") REFERENCES "categorical_modifier_value"("id") ON DELETE RESTRICT;