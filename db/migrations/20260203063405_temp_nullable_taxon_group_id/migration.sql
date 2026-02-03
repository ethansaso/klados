-- Introduce new ownership columns for character states.
-- Left temporarily nullable to allow data migration.

ALTER TABLE "taxon_character_state_categorical"
  ADD COLUMN "taxon_group_id" integer;

ALTER TABLE "taxon_character_number"
  ADD COLUMN "taxon_group_id" integer;

ALTER TABLE "taxon_character_number_range"
  ADD COLUMN "taxon_group_id" integer;
