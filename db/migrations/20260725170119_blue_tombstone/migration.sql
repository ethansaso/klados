-- Migrate categorical traits from canonical/alias pointers to synonym sets.

CREATE TABLE "trait_synonym_set" (
	"id" serial PRIMARY KEY,
	"character_id" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"legacy_root_id" integer,
	CONSTRAINT "trait_synonym_set_character_id_id_uq" UNIQUE("character_id","id")
);--> statement-breakpoint

ALTER TABLE "trait_synonym_set" ADD CONSTRAINT "trait_synonym_set_luwPg8oUIrkE_fkey" FOREIGN KEY ("character_id") REFERENCES "categorical_character_meta"("character_id") ON DELETE CASCADE;--> statement-breakpoint
CREATE INDEX "trait_synonym_set_character_idx" ON "trait_synonym_set" ("character_id");--> statement-breakpoint

-- One set per existing cluster. Canonicals (canonical_value_id IS NULL) are
-- exactly the cluster roots, including singletons.
INSERT INTO "trait_synonym_set" ("character_id", "legacy_root_id")
SELECT "character_id", "id"
FROM "categorical_trait_value"
WHERE "canonical_value_id" IS NULL;--> statement-breakpoint

CREATE UNIQUE INDEX "trait_synonym_set_legacy_root_uq" ON "trait_synonym_set" ("legacy_root_id");--> statement-breakpoint

ALTER TABLE "categorical_trait_value" ADD COLUMN "synonym_set_id" integer;--> statement-breakpoint

UPDATE "categorical_trait_value" tv
SET "synonym_set_id" = s."id"
FROM "trait_synonym_set" s
WHERE s."legacy_root_id" = COALESCE(tv."canonical_value_id", tv."id");--> statement-breakpoint

-- Guard: every trait must have landed in a set. A non-zero count here means
-- alias-of-alias chains exist (an alias whose canonical is itself an alias),
-- which the old constraints were supposed to prevent.
DO $$
DECLARE unmapped bigint;
BEGIN
	SELECT count(*) INTO unmapped
	FROM "categorical_trait_value" WHERE "synonym_set_id" IS NULL;

	IF unmapped > 0 THEN
		RAISE EXCEPTION
			'Aborted: % trait value(s) have no synonym set. Likely alias-of-alias chains; flatten them and re-run.', unmapped;
	END IF;
END $$;--> statement-breakpoint

-- Drop the alias constraints BEFORE the copy-down: hex_code_canonical_ck and
-- description_canonical_ck both forbid an alias holding its own metadata,
-- which is exactly what the next statement writes.
ALTER TABLE "categorical_trait_value" DROP CONSTRAINT "canonical_value_same_character_fk";--> statement-breakpoint
ALTER TABLE "categorical_trait_value" DROP CONSTRAINT "trait_values_no_self_alias_ck";--> statement-breakpoint
ALTER TABLE "categorical_trait_value" DROP CONSTRAINT "trait_values_hex_code_canonical_ck";--> statement-breakpoint
ALTER TABLE "categorical_trait_value" DROP CONSTRAINT "trait_values_description_canonical_ck";--> statement-breakpoint
DROP INDEX "trait_values_canonical_target_idx";--> statement-breakpoint

-- Materialize canonical metadata onto each former alias. One-time copy, not a
-- link: afterwards every row owns its own description and color. Without this
-- the migration is lossy (80 colour swatches and 4 descriptions go blank).
UPDATE "categorical_trait_value" alias
SET "description" = canon."description",
    "hex_code"    = canon."hex_code"
FROM "categorical_trait_value" canon
WHERE alias."canonical_value_id" = canon."id";--> statement-breakpoint

ALTER TABLE "categorical_trait_value" DROP COLUMN "canonical_value_id";--> statement-breakpoint
ALTER TABLE "categorical_trait_value" ALTER COLUMN "synonym_set_id" SET NOT NULL;--> statement-breakpoint

ALTER TABLE "categorical_trait_value" ADD CONSTRAINT "trait_values_char_id_set_uq" UNIQUE("character_id","id","synonym_set_id");--> statement-breakpoint
CREATE INDEX "trait_values_set_idx" ON "categorical_trait_value" ("synonym_set_id");--> statement-breakpoint
ALTER TABLE "categorical_trait_value" ADD CONSTRAINT "trait_value_synonym_set_same_character_fk" FOREIGN KEY ("character_id","synonym_set_id") REFERENCES "trait_synonym_set"("character_id","id") ON DELETE RESTRICT;--> statement-breakpoint

DROP INDEX "trait_synonym_set_legacy_root_uq";--> statement-breakpoint
ALTER TABLE "trait_synonym_set" DROP COLUMN "legacy_root_id";--> statement-breakpoint

-- Final invariants: no set may be empty, and (belt to the FK's braces) no
-- trait may reference a set belonging to a different character.
DO $$
DECLARE orphan_sets bigint; cross_character bigint;
BEGIN
	SELECT count(*) INTO orphan_sets
	FROM "trait_synonym_set" s
	WHERE NOT EXISTS (
		SELECT 1 FROM "categorical_trait_value" tv WHERE tv."synonym_set_id" = s."id"
	);

	SELECT count(*) INTO cross_character
	FROM "categorical_trait_value" tv
	JOIN "trait_synonym_set" s ON s."id" = tv."synonym_set_id"
	WHERE s."character_id" <> tv."character_id";

	IF orphan_sets > 0 THEN
		RAISE EXCEPTION 'Aborted: % synonym set(s) have no members.', orphan_sets;
	END IF;
	IF cross_character > 0 THEN
		RAISE EXCEPTION 'Aborted: % trait value(s) reference a set from another character.', cross_character;
	END IF;
END $$;
