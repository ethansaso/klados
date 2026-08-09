ALTER TABLE "taxon" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "taxon" ALTER COLUMN "status" DROP DEFAULT;--> statement-breakpoint
DROP TYPE "taxon_status";--> statement-breakpoint
CREATE TYPE "taxon_status" AS ENUM('active', 'draft', 'archived');--> statement-breakpoint
ALTER TABLE "taxon" ALTER COLUMN "status" SET DATA TYPE "taxon_status" USING "status"::"taxon_status";--> statement-breakpoint
ALTER TABLE "taxon" ALTER COLUMN "status" SET DEFAULT 'draft'::"taxon_status";