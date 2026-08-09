-- Stored numeric states were accidentally flipped in conversions.

UPDATE "taxon_character_state_number" AS n
SET "si_base_value" =
  (n."si_base_value"::numeric * u."scale" * u."scale")::double precision
FROM "unit" AS u
WHERE u."id" = n."display_unit_id";
--> statement-breakpoint
UPDATE "taxon_character_state_number_range" AS r
SET "si_base_min" =
      (r."si_base_min"::numeric * u."scale" * u."scale")::double precision,
    "si_base_max" =
      (r."si_base_max"::numeric * u."scale" * u."scale")::double precision
FROM "unit" AS u
WHERE u."id" = r."display_unit_id";
