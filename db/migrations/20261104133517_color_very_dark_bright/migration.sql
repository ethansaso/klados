-- Prepares Color sets for the seven-band palette before the color seed runs.
-- "very dark X" joins each "dark grayish X" set as its canonical label (the old
-- label stays as an alias). Each existing "bright X" label moves into a set of
-- its own, taking its states along; the seed creates the remaining bright sets
-- and writes every hex. One DO block, so it applies atomically.
DO $$
DECLARE
  color_id integer;
  hue text;
  bright record;
  new_set_id integer;
BEGIN
  SELECT c.id INTO color_id
  FROM "character" AS c
  JOIN "categorical_character_meta" AS m ON m.character_id = c.id
  WHERE c.label = 'Color';

  -- Unseeded database: seeding creates the whole palette
  IF color_id IS NULL THEN
    RETURN;
  END IF;

  FOREACH hue IN ARRAY ARRAY[
    'red', 'red-orange', 'orange', 'yellow-orange', 'yellow', 'yellow-green',
    'green', 'blue-green', 'azure', 'blue', 'purple', 'magenta', 'red-purple'
  ] LOOP
    INSERT INTO "categorical_trait_value" (character_id, synonym_set_id, label)
    SELECT color_id, v.synonym_set_id, 'very dark ' || hue
    FROM "categorical_trait_value" AS v
    WHERE v.character_id = color_id AND lower(v.label) = 'dark grayish ' || hue;

    SELECT id INTO bright
    FROM "categorical_trait_value"
    WHERE character_id = color_id AND lower(label) = 'bright ' || hue;

    CONTINUE WHEN NOT FOUND;

    INSERT INTO "trait_synonym_set" (character_id)
    VALUES (color_id)
    RETURNING id INTO new_set_id;

    -- States follow through their cascading foreign key to the label's set
    UPDATE "categorical_trait_value"
    SET synonym_set_id = new_set_id, label = 'bright ' || hue, updated_at = now()
    WHERE id = bright.id;
  END LOOP;
END $$;
