-- Backfills each state's modifier layout so existing text renders unchanged:
-- insertion (id) order, the glossary's side, and a slash after a same-group
-- neighbor on the same side (the old group-based slashing).
CREATE TYPE "modifier_joiner" AS ENUM('space', 'slash', 'comma');--> statement-breakpoint
ALTER TABLE "taxon_character_state_modifier_categorical" ADD COLUMN "position" integer;--> statement-breakpoint
ALTER TABLE "taxon_character_state_modifier_categorical" ADD COLUMN "affix_type" "affix";--> statement-breakpoint
ALTER TABLE "taxon_character_state_modifier_categorical" ADD COLUMN "joiner" "modifier_joiner";--> statement-breakpoint
ALTER TABLE "taxon_character_state_modifier_number" ADD COLUMN "position" integer;--> statement-breakpoint
ALTER TABLE "taxon_character_state_modifier_number" ADD COLUMN "affix_type" "affix";--> statement-breakpoint
ALTER TABLE "taxon_character_state_modifier_number" ADD COLUMN "joiner" "modifier_joiner";--> statement-breakpoint
ALTER TABLE "taxon_character_state_modifier_range" ADD COLUMN "position" integer;--> statement-breakpoint
ALTER TABLE "taxon_character_state_modifier_range" ADD COLUMN "affix_type" "affix";--> statement-breakpoint
ALTER TABLE "taxon_character_state_modifier_range" ADD COLUMN "joiner" "modifier_joiner";--> statement-breakpoint
UPDATE "taxon_character_state_modifier_categorical" AS m
SET "position" = o.position, "affix_type" = o.affix_type, "joiner" = o.joiner
FROM (
  SELECT
    j.id,
    (row_number() OVER (PARTITION BY j.taxon_character_state_categorical_id ORDER BY j.id) - 1)::integer AS position,
    v.affix_type,
    (CASE
      WHEN v.group_id = lag(v.group_id) OVER (
        PARTITION BY j.taxon_character_state_categorical_id, v.affix_type ORDER BY j.id
      ) THEN 'slash'
      ELSE 'space'
    END)::"modifier_joiner" AS joiner
  FROM "taxon_character_state_modifier_categorical" AS j
  JOIN "modifier_value" AS v ON v.id = j.modifier_id
) AS o
WHERE m.id = o.id;--> statement-breakpoint
UPDATE "taxon_character_state_modifier_number" AS m
SET "position" = o.position, "affix_type" = o.affix_type, "joiner" = o.joiner
FROM (
  SELECT
    j.id,
    (row_number() OVER (PARTITION BY j.taxon_character_state_number_id ORDER BY j.id) - 1)::integer AS position,
    v.affix_type,
    (CASE
      WHEN v.group_id = lag(v.group_id) OVER (
        PARTITION BY j.taxon_character_state_number_id, v.affix_type ORDER BY j.id
      ) THEN 'slash'
      ELSE 'space'
    END)::"modifier_joiner" AS joiner
  FROM "taxon_character_state_modifier_number" AS j
  JOIN "modifier_value" AS v ON v.id = j.modifier_id
) AS o
WHERE m.id = o.id;--> statement-breakpoint
UPDATE "taxon_character_state_modifier_range" AS m
SET "position" = o.position, "affix_type" = o.affix_type, "joiner" = o.joiner
FROM (
  SELECT
    j.id,
    (row_number() OVER (PARTITION BY j.taxon_character_state_range_id ORDER BY j.id) - 1)::integer AS position,
    v.affix_type,
    (CASE
      WHEN v.group_id = lag(v.group_id) OVER (
        PARTITION BY j.taxon_character_state_range_id, v.affix_type ORDER BY j.id
      ) THEN 'slash'
      ELSE 'space'
    END)::"modifier_joiner" AS joiner
  FROM "taxon_character_state_modifier_range" AS j
  JOIN "modifier_value" AS v ON v.id = j.modifier_id
) AS o
WHERE m.id = o.id;--> statement-breakpoint
ALTER TABLE "taxon_character_state_modifier_categorical" ALTER COLUMN "position" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "taxon_character_state_modifier_categorical" ALTER COLUMN "affix_type" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "taxon_character_state_modifier_categorical" ALTER COLUMN "joiner" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "taxon_character_state_modifier_number" ALTER COLUMN "position" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "taxon_character_state_modifier_number" ALTER COLUMN "affix_type" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "taxon_character_state_modifier_number" ALTER COLUMN "joiner" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "taxon_character_state_modifier_range" ALTER COLUMN "position" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "taxon_character_state_modifier_range" ALTER COLUMN "affix_type" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "taxon_character_state_modifier_range" ALTER COLUMN "joiner" SET NOT NULL;
