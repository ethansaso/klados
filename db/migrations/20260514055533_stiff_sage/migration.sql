ALTER TABLE "media" ADD COLUMN "content_hash" text NOT NULL;--> statement-breakpoint
ALTER TABLE "media" ADD COLUMN "title" text DEFAULT '' NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "media_content_hash_uq" ON "media" ("content_hash");