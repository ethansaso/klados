-- Introduce explicit attachment of character groups to taxa.

CREATE TABLE "taxon_character_group" (
  "id" serial PRIMARY KEY,
  "taxon_id" integer NOT NULL
    REFERENCES "taxon"("id") ON DELETE CASCADE,
  "group_id" integer NOT NULL
    REFERENCES "character_group"("id") ON DELETE RESTRICT,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE ("taxon_id", "group_id")
);

CREATE INDEX "taxon_character_group_taxon_idx"
  ON "taxon_character_group" ("taxon_id");
CREATE INDEX "taxon_character_group_group_idx"
  ON "taxon_character_group" ("group_id");
