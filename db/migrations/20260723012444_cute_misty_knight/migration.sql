ALTER TABLE "character" ADD COLUMN "show_in_prose" boolean;--> statement-breakpoint
UPDATE "character" SET "show_in_prose" = EXISTS (
	SELECT 1 FROM "numeric_character_meta" WHERE "numeric_character_meta"."character_id" = "character"."id"
);--> statement-breakpoint
ALTER TABLE "character" ALTER COLUMN "show_in_prose" SET NOT NULL;
