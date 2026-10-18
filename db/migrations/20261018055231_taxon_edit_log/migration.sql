CREATE TYPE "taxon_edit_kind" AS ENUM('created', 'edited', 'published', 'archived');--> statement-breakpoint
CREATE TABLE "taxon_edit" (
	"id" serial PRIMARY KEY,
	"taxon_id" integer NOT NULL,
	"user_id" text,
	"kind" "taxon_edit_kind" NOT NULL,
	"names" boolean DEFAULT false NOT NULL,
	"taxonomy" boolean DEFAULT false NOT NULL,
	"external_ids" boolean DEFAULT false NOT NULL,
	"morphology" boolean DEFAULT false NOT NULL,
	"media" boolean DEFAULT false NOT NULL,
	"sources" boolean DEFAULT false NOT NULL,
	"ecology" boolean DEFAULT false NOT NULL,
	"notes" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "taxon_edit_edited_has_area_ck" CHECK ("kind" <> 'edited' OR "names" OR "taxonomy" OR "external_ids" OR "morphology" OR "media" OR "sources" OR "ecology" OR "notes")
);
--> statement-breakpoint
CREATE INDEX "taxon_edit_taxon_created_idx" ON "taxon_edit" ("taxon_id","created_at");--> statement-breakpoint
CREATE INDEX "taxon_edit_user_idx" ON "taxon_edit" ("user_id");--> statement-breakpoint
ALTER TABLE "taxon_edit" ADD CONSTRAINT "taxon_edit_taxon_id_taxon_id_fkey" FOREIGN KEY ("taxon_id") REFERENCES "taxon"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "taxon_edit" ADD CONSTRAINT "taxon_edit_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE SET NULL;