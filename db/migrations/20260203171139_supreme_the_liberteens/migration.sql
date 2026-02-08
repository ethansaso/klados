-- Create new table to represent taxon-character-group-state relationships
CREATE TABLE "taxon_character_group_state" (
	"id" serial PRIMARY KEY,
	"taxon_id" integer NOT NULL,
	"group_id" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint

-- Migrate existing data into new table
INSERT INTO "taxon_character_group_state" ("taxon_id", "group_id")
SELECT DISTINCT
  tcg."taxon_id",
  tcg."group_id"
FROM "taxon_character_group" tcg
ON CONFLICT DO NOTHING;
--> statement-breakpoint

-- Drop old foreign key constraints
-- ALTER TABLE "taxon_character_state_categorical" DROP CONSTRAINT "taxon_character_state_categorical_JqAvW6jl7DvJ_fkey";--> statement-breakpoint
ALTER TABLE "taxon_character_state_categorical" DROP CONSTRAINT "tcs_cat_taxon_group_pair_fk";--> statement-breakpoint
-- ALTER TABLE "taxon_character_number" DROP CONSTRAINT "taxon_character_number_QEA4B5Yz83Gy_fkey";--> statement-breakpoint
ALTER TABLE "taxon_character_number" DROP CONSTRAINT "tcn_taxon_group_pair_fk";--> statement-breakpoint
-- ALTER TABLE "taxon_character_number_range" DROP CONSTRAINT "taxon_character_number_range_KxUKWfmXuEAG_fkey";--> statement-breakpoint
ALTER TABLE "taxon_character_number_range" DROP CONSTRAINT "tcnr_taxon_group_pair_fk";--> statement-breakpoint

-- Rename columns to reflect new relationship
ALTER TABLE "taxon_character_state_categorical" RENAME COLUMN "taxon_group_id" TO "taxon_group_state_id";--> statement-breakpoint
ALTER TABLE "taxon_character_number" RENAME COLUMN "taxon_group_id" TO "taxon_group_state_id";--> statement-breakpoint
ALTER TABLE "taxon_character_number_range" RENAME COLUMN "taxon_group_id" TO "taxon_group_state_id";--> statement-breakpoint

-- Rewire state rows to new group-state ids
ALTER TABLE "taxon_character_state_categorical" DROP CONSTRAINT "tcs_cat_taxon_group_fk"; --> statement-breakpoint
ALTER TABLE "taxon_character_number" DROP CONSTRAINT "tcn_taxon_group_fk"; --> statement-breakpoint
ALTER TABLE "taxon_character_number_range" DROP CONSTRAINT "tcnr_taxon_group_fk"; --> statement-breakpoint
UPDATE "taxon_character_state_categorical" s
SET "taxon_group_state_id" = tgs."id"
FROM "taxon_character_group_state" tgs
JOIN "taxon_character_group" tcg
  ON tcg."taxon_id" = tgs."taxon_id"
 AND tcg."group_id" = tgs."group_id"
WHERE s."taxon_group_state_id" = tcg."id";
--> statement-breakpoint
UPDATE "taxon_character_number" s
SET "taxon_group_state_id" = tgs."id"
FROM "taxon_character_group_state" tgs
JOIN "taxon_character_group" tcg
  ON tcg."taxon_id" = tgs."taxon_id"
 AND tcg."group_id" = tgs."group_id"
WHERE s."taxon_group_state_id" = tcg."id";
--> statement-breakpoint
UPDATE "taxon_character_number_range" s
SET "taxon_group_state_id" = tgs."id"
FROM "taxon_character_group_state" tgs
JOIN "taxon_character_group" tcg
  ON tcg."taxon_id" = tgs."taxon_id"
 AND tcg."group_id" = tgs."group_id"
WHERE s."taxon_group_state_id" = tcg."id";
--> statement-breakpoint

-- Indexes for taxon_character_group_state
CREATE UNIQUE INDEX "taxon_character_group_state_taxon_group_uq"
  ON "taxon_character_group_state" ("taxon_id","group_id");
--> statement-breakpoint
CREATE UNIQUE INDEX "taxon_character_group_state_id_group_uq"
  ON "taxon_character_group_state" ("id","group_id");
--> statement-breakpoint
CREATE INDEX "taxon_character_group_state_taxon_idx"
  ON "taxon_character_group_state" ("taxon_id");
--> statement-breakpoint
CREATE INDEX "taxon_character_group_state_group_idx"
  ON "taxon_character_group_state" ("group_id");
--> statement-breakpoint

-- Recreate state-table indexes
CREATE UNIQUE INDEX "tcs_cat_group_state_char_trait_uq"
  ON "taxon_character_state_categorical"
  ("taxon_group_state_id","character_id","trait_value_id");
--> statement-breakpoint
CREATE INDEX "tcs_cat_taxon_group_state_idx"
  ON "taxon_character_state_categorical" ("taxon_group_state_id");
--> statement-breakpoint
CREATE UNIQUE INDEX "tcn_group_state_char_uq"
  ON "taxon_character_number"
  ("taxon_group_state_id","character_id");
--> statement-breakpoint
CREATE INDEX "tcn_taxon_group_state_idx"
  ON "taxon_character_number" ("taxon_group_state_id");
--> statement-breakpoint
CREATE UNIQUE INDEX "tcnr_group_state_char_uq"
  ON "taxon_character_number_range"
  ("taxon_group_state_id","character_id");
--> statement-breakpoint
CREATE INDEX "tcnr_group_state_idx"
  ON "taxon_character_number_range" ("taxon_group_state_id");
--> statement-breakpoint

-- Add foreign keys
ALTER TABLE "taxon_character_group_state"
  ADD CONSTRAINT "taxon_character_group_state_taxon_id_taxon_id_fkey"
  FOREIGN KEY ("taxon_id")
  REFERENCES "taxon"("id")
  ON DELETE CASCADE;
--> statement-breakpoint
ALTER TABLE "taxon_character_group_state"
  ADD CONSTRAINT "taxon_character_group_state_group_id_character_group_id_fkey"
  FOREIGN KEY ("group_id")
  REFERENCES "character_group"("id")
  ON DELETE RESTRICT;
--> statement-breakpoint
ALTER TABLE "taxon_character_state_categorical"
  ADD CONSTRAINT "taxon_character_state_categorical_akVvbMtfkUdt_fkey"
  FOREIGN KEY ("taxon_group_state_id")
  REFERENCES "taxon_character_group_state"("id")
  ON DELETE CASCADE;
--> statement-breakpoint
ALTER TABLE "taxon_character_state_categorical"
  ADD CONSTRAINT "tcs_cat_taxon_group_state_pair_fk"
  FOREIGN KEY ("taxon_group_state_id","group_id")
  REFERENCES "taxon_character_group_state"("id","group_id");
--> statement-breakpoint
ALTER TABLE "taxon_character_number"
  ADD CONSTRAINT "taxon_character_number_k991lfYhWmlI_fkey"
  FOREIGN KEY ("taxon_group_state_id")
  REFERENCES "taxon_character_group_state"("id")
  ON DELETE CASCADE;
--> statement-breakpoint
ALTER TABLE "taxon_character_number"
  ADD CONSTRAINT "tcn_taxon_group_state_pair_fk"
  FOREIGN KEY ("taxon_group_state_id","group_id")
  REFERENCES "taxon_character_group_state"("id","group_id");
--> statement-breakpoint
ALTER TABLE "taxon_character_number_range"
  ADD CONSTRAINT "taxon_character_number_range_PldHko41g7HY_fkey"
  FOREIGN KEY ("taxon_group_state_id")
  REFERENCES "taxon_character_group_state"("id")
  ON DELETE CASCADE;
--> statement-breakpoint
ALTER TABLE "taxon_character_number_range"
  ADD CONSTRAINT "tcnr_taxon_group_state_pair_fk"
  FOREIGN KEY ("taxon_group_state_id","group_id")
  REFERENCES "taxon_character_group_state"("id","group_id");
--> statement-breakpoint