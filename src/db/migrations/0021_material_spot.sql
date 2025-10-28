ALTER TABLE "taxa" ALTER COLUMN "media" SET DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "taxa" ALTER COLUMN "media" SET NOT NULL;