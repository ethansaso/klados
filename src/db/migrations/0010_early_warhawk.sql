ALTER TABLE "user" DROP CONSTRAINT "user_display_username_unique";--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "display_username" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "role" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "role" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "role" DROP NOT NULL;--> statement-breakpoint
DROP TYPE "public"."user_role";