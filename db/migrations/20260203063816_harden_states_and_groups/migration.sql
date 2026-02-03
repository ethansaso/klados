-- Step 4: Harden group-based ownership and correctness
-- Assumes:
-- - taxon_character_group exists
-- - taxon_group_id is fully backfilled
-- - legacy taxon_id columns still exist

------------------------------------------------------------
-- 0. Make (id, group_id) addressable for composite FKs
------------------------------------------------------------

ALTER TABLE "taxon_character_group"
  ADD CONSTRAINT "taxon_character_group_id_group_uq"
  UNIQUE ("id", "group_id");

ALTER TABLE "character"
  ADD CONSTRAINT "character_id_group_uq"
  UNIQUE ("id", "group_id");

------------------------------------------------------------
-- 1. Add group_id columns (stored, non-generated)
------------------------------------------------------------

ALTER TABLE "taxon_character_state_categorical"
  ADD COLUMN "group_id" integer;

ALTER TABLE "taxon_character_number"
  ADD COLUMN "group_id" integer;

ALTER TABLE "taxon_character_number_range"
  ADD COLUMN "group_id" integer;

------------------------------------------------------------
-- 2. Backfill group_id from taxon_character_group
------------------------------------------------------------

UPDATE "taxon_character_state_categorical" s
SET "group_id" = tcg."group_id"
FROM "taxon_character_group" tcg
WHERE s."taxon_group_id" = tcg."id";

UPDATE "taxon_character_number" s
SET "group_id" = tcg."group_id"
FROM "taxon_character_group" tcg
WHERE s."taxon_group_id" = tcg."id";

UPDATE "taxon_character_number_range" s
SET "group_id" = tcg."group_id"
FROM "taxon_character_group" tcg
WHERE s."taxon_group_id" = tcg."id";

------------------------------------------------------------
-- 3. Drop legacy ownership foreign keys
------------------------------------------------------------

ALTER TABLE "taxon_character_state_categorical"
  DROP CONSTRAINT IF EXISTS "taxon_character_state_categorical_taxon_id_taxon_id_fk";

ALTER TABLE "taxon_character_number"
  DROP CONSTRAINT IF EXISTS "taxon_character_number_taxon_id_taxon_id_fk";

ALTER TABLE "taxon_character_number_range"
  DROP CONSTRAINT IF EXISTS "taxon_character_number_range_taxon_id_taxon_id_fk";

------------------------------------------------------------
-- 4. Enforce NOT NULL on ownership columns
------------------------------------------------------------

ALTER TABLE "taxon_character_state_categorical"
  ALTER COLUMN "taxon_group_id" SET NOT NULL,
  ALTER COLUMN "group_id" SET NOT NULL;

ALTER TABLE "taxon_character_number"
  ALTER COLUMN "taxon_group_id" SET NOT NULL,
  ALTER COLUMN "group_id" SET NOT NULL;

ALTER TABLE "taxon_character_number_range"
  ALTER COLUMN "taxon_group_id" SET NOT NULL,
  ALTER COLUMN "group_id" SET NOT NULL;

------------------------------------------------------------
-- 5. Add ownership foreign keys
------------------------------------------------------------

ALTER TABLE "taxon_character_state_categorical"
  ADD CONSTRAINT "tcs_cat_taxon_group_fk"
  FOREIGN KEY ("taxon_group_id")
  REFERENCES "taxon_character_group"("id")
  ON DELETE CASCADE;

ALTER TABLE "taxon_character_number"
  ADD CONSTRAINT "tcn_taxon_group_fk"
  FOREIGN KEY ("taxon_group_id")
  REFERENCES "taxon_character_group"("id")
  ON DELETE CASCADE;

ALTER TABLE "taxon_character_number_range"
  ADD CONSTRAINT "tcnr_taxon_group_fk"
  FOREIGN KEY ("taxon_group_id")
  REFERENCES "taxon_character_group"("id")
  ON DELETE CASCADE;

------------------------------------------------------------
-- 6. Enforce group correctness (composite FKs)
------------------------------------------------------------

ALTER TABLE "taxon_character_state_categorical"
  ADD CONSTRAINT "tcs_cat_taxon_group_pair_fk"
  FOREIGN KEY ("taxon_group_id", "group_id")
  REFERENCES "taxon_character_group"("id", "group_id");

ALTER TABLE "taxon_character_state_categorical"
  ADD CONSTRAINT "tcs_cat_character_group_fk"
  FOREIGN KEY ("character_id", "group_id")
  REFERENCES "character"("id", "group_id");

ALTER TABLE "taxon_character_number"
  ADD CONSTRAINT "tcn_taxon_group_pair_fk"
  FOREIGN KEY ("taxon_group_id", "group_id")
  REFERENCES "taxon_character_group"("id", "group_id");

ALTER TABLE "taxon_character_number"
  ADD CONSTRAINT "tcn_character_group_fk"
  FOREIGN KEY ("character_id", "group_id")
  REFERENCES "character"("id", "group_id");

ALTER TABLE "taxon_character_number_range"
  ADD CONSTRAINT "tcnr_taxon_group_pair_fk"
  FOREIGN KEY ("taxon_group_id", "group_id")
  REFERENCES "taxon_character_group"("id", "group_id");

ALTER TABLE "taxon_character_number_range"
  ADD CONSTRAINT "tcnr_character_group_fk"
  FOREIGN KEY ("character_id", "group_id")
  REFERENCES "character"("id", "group_id");

------------------------------------------------------------
-- 7. Drop legacy taxon_id columns
------------------------------------------------------------

ALTER TABLE "taxon_character_state_categorical"
  DROP COLUMN "taxon_id";

ALTER TABLE "taxon_character_number"
  DROP COLUMN "taxon_id";

ALTER TABLE "taxon_character_number_range"
  DROP COLUMN "taxon_id";
