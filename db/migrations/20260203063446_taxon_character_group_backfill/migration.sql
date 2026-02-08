-- Backfill taxon_character_group rows and link existing character states
-- to their corresponding taxon_group_id.

------------------------------------------------------------
-- 1. Create missing taxon_character_group rows
------------------------------------------------------------

INSERT INTO "taxon_character_group" ("taxon_id", "group_id")
SELECT DISTINCT
  s."taxon_id",
  c."group_id"
FROM "taxon_character_state_categorical" s
JOIN "character" c ON c."id" = s."character_id"
WHERE s."taxon_group_id" IS NULL
ON CONFLICT DO NOTHING;

INSERT INTO "taxon_character_group" ("taxon_id", "group_id")
SELECT DISTINCT
  s."taxon_id",
  c."group_id"
FROM "taxon_character_number" s
JOIN "character" c ON c."id" = s."character_id"
WHERE s."taxon_group_id" IS NULL
ON CONFLICT DO NOTHING;

INSERT INTO "taxon_character_group" ("taxon_id", "group_id")
SELECT DISTINCT
  s."taxon_id",
  c."group_id"
FROM "taxon_character_number_range" s
JOIN "character" c ON c."id" = s."character_id"
WHERE s."taxon_group_id" IS NULL
ON CONFLICT DO NOTHING;

------------------------------------------------------------
-- 2. Backfill taxon_group_id on state tables
------------------------------------------------------------

UPDATE "taxon_character_state_categorical" s
SET "taxon_group_id" = tcg."id"
FROM "taxon_character_group" tcg,
     "character" c
WHERE s."taxon_group_id" IS NULL
  AND c."id" = s."character_id"
  AND tcg."taxon_id" = s."taxon_id"
  AND tcg."group_id" = c."group_id";

UPDATE "taxon_character_number" s
SET "taxon_group_id" = tcg."id"
FROM "taxon_character_group" tcg,
     "character" c
WHERE s."taxon_group_id" IS NULL
  AND c."id" = s."character_id"
  AND tcg."taxon_id" = s."taxon_id"
  AND tcg."group_id" = c."group_id";

UPDATE "taxon_character_number_range" s
SET "taxon_group_id" = tcg."id"
FROM "taxon_character_group" tcg,
     "character" c
WHERE s."taxon_group_id" IS NULL
  AND c."id" = s."character_id"
  AND tcg."taxon_id" = s."taxon_id"
  AND tcg."group_id" = c."group_id";