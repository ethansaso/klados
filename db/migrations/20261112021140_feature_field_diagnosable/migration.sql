ALTER TABLE "feature" ADD COLUMN "field_diagnosable" boolean NOT NULL DEFAULT true;--> statement-breakpoint
ALTER TABLE "feature" ALTER COLUMN "field_diagnosable" DROP DEFAULT;
