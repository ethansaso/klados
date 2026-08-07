-- Denormalises the trait value's synonym set onto categorical state rows.
--
-- Values in a set are interchangeable ("striate" / "lined" / "grooved"), so a
-- search for one must match a taxon recorded with another. Storing the set here
-- makes that an indexed equality rather than a join or a pre-expansion query.
--
-- Added nullable first so existing rows can be backfilled before NOT NULL; the
-- composite FK then guarantees the copy can never disagree with its source.

ALTER TABLE "taxon_character_state_categorical" ADD COLUMN "synonym_set_id" integer;--> statement-breakpoint

UPDATE "taxon_character_state_categorical" AS s
SET "synonym_set_id" = v."synonym_set_id"
FROM "categorical_trait_value" AS v
WHERE v."id" = s."trait_value_id";--> statement-breakpoint

ALTER TABLE "taxon_character_state_categorical" ALTER COLUMN "synonym_set_id" SET NOT NULL;--> statement-breakpoint

CREATE INDEX "tcs_cat_char_set_idx" ON "taxon_character_state_categorical" ("character_id","synonym_set_id");--> statement-breakpoint
ALTER TABLE "taxon_character_state_categorical" ADD CONSTRAINT "tcs_cat_trait_synonym_set_fk" FOREIGN KEY ("character_id","trait_value_id","synonym_set_id") REFERENCES "categorical_trait_value"("character_id","id","synonym_set_id") ON UPDATE CASCADE;
