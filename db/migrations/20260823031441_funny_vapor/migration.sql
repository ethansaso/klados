ALTER TABLE "categorical_trait_value" ADD COLUMN "media_id" integer;--> statement-breakpoint
ALTER TABLE "modifier_value" ADD COLUMN "media_id" integer;--> statement-breakpoint
ALTER TABLE "categorical_trait_value" ADD CONSTRAINT "categorical_trait_value_media_id_media_id_fkey" FOREIGN KEY ("media_id") REFERENCES "media"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "modifier_value" ADD CONSTRAINT "modifier_value_media_id_media_id_fkey" FOREIGN KEY ("media_id") REFERENCES "media"("id") ON DELETE SET NULL;