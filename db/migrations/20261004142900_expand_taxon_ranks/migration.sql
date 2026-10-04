DO $$
BEGIN
	IF EXISTS (SELECT 1 FROM "taxon" WHERE "rank" = 'domain') THEN
		RAISE EXCEPTION 'Rank "domain" is being removed; re-rank or delete taxa with rank domain before migrating.';
	END IF;
END $$;--> statement-breakpoint
ALTER TABLE "taxon" ALTER COLUMN "rank" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "taxon_rank";--> statement-breakpoint
CREATE TYPE "taxon_rank" AS ENUM('kingdom', 'phylum', 'subphylum', 'superclass', 'class', 'subclass', 'infraclass', 'superorder', 'order', 'suborder', 'infraorder', 'superfamily', 'family', 'subfamily', 'supertribe', 'tribe', 'subtribe', 'genus', 'subgenus', 'section', 'subsection', 'complex', 'species', 'subspecies', 'variety', 'form');--> statement-breakpoint
ALTER TABLE "taxon" ALTER COLUMN "rank" SET DATA TYPE "taxon_rank" USING "rank"::"taxon_rank";