ALTER TABLE "categorical_character_meta" ADD COLUMN "has_locked_sets" boolean DEFAULT false NOT NULL;--> statement-breakpoint
-- Only seeding can write set hex codes, so any character that already has
-- them has seeded, locked sets. Lock it from the moment this deploys.
UPDATE "categorical_character_meta" AS m
SET "has_locked_sets" = true
WHERE EXISTS (
  SELECT 1
  FROM "trait_synonym_set" AS s
  WHERE s.character_id = m.character_id
    AND s.hex_code IS NOT NULL
);
