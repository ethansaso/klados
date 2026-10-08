-- Fails, naming the pair, if a character has labels differing only by case;
-- merge or rename those first. Created before the old index is dropped, so
-- uniqueness is never unenforced.
CREATE UNIQUE INDEX "trait_values_character_label_lower_uq" ON "categorical_trait_value" ("character_id",lower("label"));--> statement-breakpoint
DROP INDEX "trait_values_character_label_uq";
