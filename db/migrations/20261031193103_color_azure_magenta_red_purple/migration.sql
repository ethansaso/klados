-- Renames the 300° hue from red-purple to magenta, then adds azure (200°) and a
-- new red-purple (330°). Hexes must match `buildColorPalette`, so running the
-- color seed afterward changes nothing. One DO block, so it applies atomically.
DO $$
DECLARE
  color_id integer;
  shade text;
  canonical record;
  taken record;
  new_color record;
BEGIN
  SELECT c.id INTO color_id
  FROM "character" AS c
  JOIN "categorical_character_meta" AS m ON m.character_id = c.id
  WHERE c.label = 'Color';

  -- Unseeded database: seeding creates the whole palette
  IF color_id IS NULL THEN
    RETURN;
  END IF;

  FOREACH shade IN ARRAY ARRAY['pale ', 'light ', '', 'grayish ', 'dark ', 'dark grayish '] LOOP
    SELECT id, synonym_set_id, description, media_id INTO canonical
    FROM "categorical_trait_value"
    WHERE character_id = color_id AND lower(label) = shade || 'red-purple';

    CONTINUE WHEN NOT FOUND;

    SELECT id, synonym_set_id, description, media_id INTO taken
    FROM "categorical_trait_value"
    WHERE character_id = color_id AND lower(label) = shade || 'magenta';

    -- A synonym already holds the new name: merge it into the canonical row
    IF FOUND THEN
      IF taken.synonym_set_id <> canonical.synonym_set_id THEN
        RAISE EXCEPTION '"%" is already a label outside the set of "%"; move it first',
          shade || 'magenta', shade || 'red-purple';
      END IF;

      DELETE FROM "taxon_character_state_categorical" AS dup
      WHERE dup.trait_value_id = taken.id
        AND EXISTS (
          SELECT 1
          FROM "taxon_character_state_categorical" AS kept
          WHERE kept.trait_value_id = canonical.id
            AND kept.taxon_feature_state_id = dup.taxon_feature_state_id
        );

      UPDATE "taxon_character_state_categorical"
      SET trait_value_id = canonical.id
      WHERE trait_value_id = taken.id;

      DELETE FROM "categorical_trait_value" WHERE id = taken.id;

      UPDATE "categorical_trait_value"
      SET description = COALESCE(NULLIF(canonical.description, ''), taken.description),
          media_id = COALESCE(canonical.media_id, taken.media_id)
      WHERE id = canonical.id;
    END IF;

    UPDATE "categorical_trait_value"
    SET label = shade || 'magenta', updated_at = NOW()
    WHERE id = canonical.id;
  END LOOP;

  -- Fails on any label already in use, rather than absorbing it into a new set
  FOR new_color IN
    SELECT * FROM (VALUES
      ('pale azure', '#c2e0f0'),
      ('light azure', '#99ddff'),
      ('azure', '#00aaff'),
      ('grayish azure', '#4095bf'),
      ('dark azure', '#005580'),
      ('dark grayish azure', '#204a60'),
      ('pale red-purple', '#f0c2d9'),
      ('light red-purple', '#ff99cc'),
      ('red-purple', '#ff0080'),
      ('grayish red-purple', '#bf4080'),
      ('dark red-purple', '#800040'),
      ('dark grayish red-purple', '#602040')
    ) AS palette(label, hex_code)
  LOOP
    WITH new_set AS (
      INSERT INTO "trait_synonym_set" (character_id, hex_code)
      VALUES (color_id, new_color.hex_code)
      RETURNING id
    )
    INSERT INTO "categorical_trait_value" (character_id, synonym_set_id, label)
    SELECT color_id, new_set.id, new_color.label
    FROM new_set;
  END LOOP;

  -- States follow through the cascading set foreign key
  UPDATE "categorical_trait_value"
  SET synonym_set_id = (
        SELECT synonym_set_id
        FROM "categorical_trait_value"
        WHERE character_id = color_id AND label = 'red-purple'
      ),
      updated_at = NOW()
  WHERE character_id = color_id AND lower(label) IN ('rose', 'reddish purple');

  INSERT INTO "categorical_trait_value" (character_id, synonym_set_id, label)
  SELECT color_id, synonym_set_id, 'sky-blue'
  FROM "categorical_trait_value"
  WHERE character_id = color_id AND label = 'azure';
END $$;
