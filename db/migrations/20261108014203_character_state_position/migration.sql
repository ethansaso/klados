-- Backfills each character's state order from insertion (id) order.
ALTER TABLE "taxon_character_state_categorical" ADD COLUMN "position" integer;--> statement-breakpoint
ALTER TABLE "taxon_character_state_number" ADD COLUMN "position" integer;--> statement-breakpoint
ALTER TABLE "taxon_character_state_number_range" ADD COLUMN "position" integer;--> statement-breakpoint
UPDATE "taxon_character_state_categorical" AS s
SET "position" = o.position
FROM (
  SELECT id, (row_number() OVER (
    PARTITION BY taxon_feature_state_id, character_id ORDER BY id
  ) - 1)::integer AS position
  FROM "taxon_character_state_categorical"
) AS o
WHERE s.id = o.id;--> statement-breakpoint
UPDATE "taxon_character_state_number" AS s
SET "position" = o.position
FROM (
  SELECT id, (row_number() OVER (
    PARTITION BY taxon_feature_state_id, character_id ORDER BY id
  ) - 1)::integer AS position
  FROM "taxon_character_state_number"
) AS o
WHERE s.id = o.id;--> statement-breakpoint
UPDATE "taxon_character_state_number_range" AS s
SET "position" = o.position
FROM (
  SELECT id, (row_number() OVER (
    PARTITION BY taxon_feature_state_id, character_id ORDER BY id
  ) - 1)::integer AS position
  FROM "taxon_character_state_number_range"
) AS o
WHERE s.id = o.id;--> statement-breakpoint
ALTER TABLE "taxon_character_state_categorical" ALTER COLUMN "position" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "taxon_character_state_number" ALTER COLUMN "position" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "taxon_character_state_number_range" ALTER COLUMN "position" SET NOT NULL;
