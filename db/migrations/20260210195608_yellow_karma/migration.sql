DROP INDEX "guide_root_name_uq";--> statement-breakpoint
CREATE INDEX "guide_status_idx" ON "guide" ("status");--> statement-breakpoint
CREATE INDEX "guide_author_idx" ON "guide" ("author_id");--> statement-breakpoint
CREATE UNIQUE INDEX "guide_root_name_author_uq" ON "guide" ("root_taxon_id","name","author_id");--> statement-breakpoint
ALTER TABLE "guide" ADD CONSTRAINT "guide_author_id_user_id_fkey" FOREIGN KEY ("author_id") REFERENCES "user"("id") ON DELETE CASCADE;