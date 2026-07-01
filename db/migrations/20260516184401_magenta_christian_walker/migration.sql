ALTER TABLE "character" ADD COLUMN "media_id" integer;--> statement-breakpoint
ALTER TABLE "feature" ADD COLUMN "media_id" integer;--> statement-breakpoint
ALTER TABLE "character" ADD CONSTRAINT "character_media_id_media_id_fkey" FOREIGN KEY ("media_id") REFERENCES "media"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "feature" ADD CONSTRAINT "feature_media_id_media_id_fkey" FOREIGN KEY ("media_id") REFERENCES "media"("id") ON DELETE SET NULL;