CREATE TYPE "distribution_tile_status" AS ENUM('ok', 'empty', 'failed');--> statement-breakpoint
CREATE TABLE "taxon_distribution_tile" (
	"taxon_id" integer PRIMARY KEY,
	"gbif_id" integer NOT NULL,
	"status" "distribution_tile_status" NOT NULL,
	"generated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "taxon_distribution_tile" ADD CONSTRAINT "taxon_distribution_tile_taxon_id_taxon_id_fkey" FOREIGN KEY ("taxon_id") REFERENCES "taxon"("id") ON DELETE CASCADE;