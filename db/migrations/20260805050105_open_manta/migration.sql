-- The si_base_* columns have always been `double precision`, despite the schema
-- declaring numeric(30,18): they were renamed from value_num/value_min/value_max
-- early on and kept their original type, and no migration ever changed it.
--
-- Binary floats make boundary containment unreliable, which is the common case
-- for this data: a bound entered as "5 cm" and a search for "5 cm" can land a
-- bit apart, so a taxon recorded 5-25 cm would not match a search for 5 cm.
-- Exact decimal removes that failure entirely.
--
-- Ordering matters: Postgres refuses to alter the type of a column that a
-- generated column depends on, so value_range has to be dropped first and
-- rebuilt afterwards. Dropping it takes its GiST index with it.

ALTER TABLE "taxon_character_state_number" DROP COLUMN "value_range";--> statement-breakpoint
ALTER TABLE "taxon_character_state_number_range" DROP COLUMN "value_range";--> statement-breakpoint

ALTER TABLE "taxon_character_state_number"
  ALTER COLUMN "si_base_value" TYPE numeric(30, 18)
  USING "si_base_value"::numeric(30, 18);--> statement-breakpoint
ALTER TABLE "taxon_character_state_number_range"
  ALTER COLUMN "si_base_min" TYPE numeric(30, 18)
  USING "si_base_min"::numeric(30, 18);--> statement-breakpoint
ALTER TABLE "taxon_character_state_number_range"
  ALTER COLUMN "si_base_max" TYPE numeric(30, 18)
  USING "si_base_max"::numeric(30, 18);--> statement-breakpoint

ALTER TABLE "taxon_character_state_number" ADD COLUMN "value_range" numrange GENERATED ALWAYS AS (numrange(si_base_value, si_base_value, '[]')) STORED;--> statement-breakpoint
ALTER TABLE "taxon_character_state_number_range" ADD COLUMN "value_range" numrange GENERATED ALWAYS AS (numrange(si_base_min, si_base_max, '[]')) STORED;--> statement-breakpoint
CREATE INDEX "tcn_value_range_idx" ON "taxon_character_state_number" USING gist ("value_range");--> statement-breakpoint
CREATE INDEX "tcnr_value_range_idx" ON "taxon_character_state_number_range" USING gist ("value_range");
