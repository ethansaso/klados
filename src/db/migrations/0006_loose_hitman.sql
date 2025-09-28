ALTER TABLE "user" DROP CONSTRAINT "user_username_len_check";--> statement-breakpoint
DROP INDEX "user_username_idx";--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "name" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "username" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "display_username" text;