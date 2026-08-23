-- Presence becomes three-valued: present / variable / absent.
--
-- "variable" carries over the old `unreliable` flag. "absent" is new: a curator
-- asserting a feature is conclusively not borne, which is a different claim
-- from saying nothing at all.
--
-- ! HAND-EDITED. drizzle-kit dropped `unreliable` with no backfill, and ordered
-- ! the drop of taxon_feature_state_id_feature_uq before the FKs that depend on
-- ! it. Both are corrected below; regenerating will reintroduce them.

------------------------------------------------------------
-- 1. Fold `unreliable` into the new presence enum
------------------------------------------------------------

CREATE TYPE "feature_presence" AS ENUM('present', 'variable', 'absent');--> statement-breakpoint

ALTER TABLE "taxon_feature_state" ADD COLUMN "presence" "feature_presence" DEFAULT 'present'::"feature_presence" NOT NULL;--> statement-breakpoint

-- Must precede the DROP below, or every "sometimes present" curation silently
-- flattens to "present".
UPDATE "taxon_feature_state" SET "presence" = 'variable' WHERE "unreliable";--> statement-breakpoint

ALTER TABLE "taxon_feature_state" DROP COLUMN "unreliable";--> statement-breakpoint

------------------------------------------------------------
-- 2. Give absent rows no key for a character state to hold
------------------------------------------------------------

-- NULL for absent rows, so the composite FKs below have nothing to match and
-- the "absent features carry no character states" invariant needs no triggers
-- and no application code to hold it.
ALTER TABLE "taxon_feature_state" ADD COLUMN "characterizable_id" integer GENERATED ALWAYS AS (CASE WHEN presence = 'absent' THEN NULL ELSE id END) STORED;--> statement-breakpoint

CREATE UNIQUE INDEX "taxon_feature_state_characterizable_feature_uq" ON "taxon_feature_state" ("characterizable_id","feature_id");--> statement-breakpoint

------------------------------------------------------------
-- 3. Repoint the state tables at that key
------------------------------------------------------------

ALTER TABLE "taxon_character_state_categorical" DROP CONSTRAINT "tcs_cat_taxon_feature_state_pair_fk", ADD CONSTRAINT "tcs_cat_taxon_feature_state_pair_fk" FOREIGN KEY ("taxon_feature_state_id","feature_id") REFERENCES "taxon_feature_state"("characterizable_id","feature_id");--> statement-breakpoint

ALTER TABLE "taxon_character_state_number" DROP CONSTRAINT "tcn_taxon_feature_state_pair_fk", ADD CONSTRAINT "tcn_taxon_feature_state_pair_fk" FOREIGN KEY ("taxon_feature_state_id","feature_id") REFERENCES "taxon_feature_state"("characterizable_id","feature_id");--> statement-breakpoint

ALTER TABLE "taxon_character_state_number_range" DROP CONSTRAINT "tcnr_taxon_feature_state_pair_fk", ADD CONSTRAINT "tcnr_taxon_feature_state_pair_fk" FOREIGN KEY ("taxon_feature_state_id","feature_id") REFERENCES "taxon_feature_state"("characterizable_id","feature_id");--> statement-breakpoint

------------------------------------------------------------
-- 4. Retire the old FK target
------------------------------------------------------------

-- Last: the three constraints above depended on this index until step 3.
DROP INDEX "taxon_feature_state_id_feature_uq";
