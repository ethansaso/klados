ALTER TABLE "categorical_trait_value" DROP CONSTRAINT "trait_values_hex_code_format_ck";--> statement-breakpoint
ALTER TABLE "trait_synonym_set" ADD COLUMN "hex_code" text;--> statement-breakpoint
-- Synonyms must already agree on a swatch (NULL counts as a value), so
-- refuse rather than silently pick one.
DO $$
DECLARE conflicts text;
BEGIN
  SELECT string_agg(synonym_set_id::text, ', ') INTO conflicts
  FROM (
    SELECT synonym_set_id
    FROM "categorical_trait_value"
    GROUP BY synonym_set_id
    HAVING COUNT(DISTINCT COALESCE(hex_code, '')) > 1
  ) AS mixed;

  IF conflicts IS NOT NULL THEN
    RAISE EXCEPTION 'Synonym sets with conflicting hex codes: %', conflicts;
  END IF;
END $$;--> statement-breakpoint
UPDATE "trait_synonym_set" AS s
SET "hex_code" = v.hex_code
FROM (
  SELECT DISTINCT synonym_set_id, hex_code
  FROM "categorical_trait_value"
  WHERE hex_code IS NOT NULL
) AS v
WHERE v.synonym_set_id = s.id;--> statement-breakpoint
ALTER TABLE "categorical_trait_value" DROP COLUMN "hex_code";--> statement-breakpoint
ALTER TABLE "trait_synonym_set" ADD CONSTRAINT "trait_synonym_set_hex_code_format_ck" CHECK ("hex_code" IS NULL OR "hex_code" ~ '^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$');