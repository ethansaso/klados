ALTER TABLE "user" ADD COLUMN "username" text NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "user_username_idx" ON "user" USING btree ("username");--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_username_unique" UNIQUE("username");--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_username_len_check" CHECK (char_length("user"."username") >= 3);