CREATE TYPE "public"."media_license" AS ENUM('unknown', 'cc0', 'cc-by', 'cc-by-sa', 'cc-by-nc', 'cc-by-nc-sa', 'cc-by-nd', 'cc-by-nc-nd', 'all-rights-reserved');
--> statement-breakpoint
CREATE TABLE "character_media" (
	"character_id" integer,
	"media_id" integer,
	CONSTRAINT "character_media_pk" PRIMARY KEY("character_id","media_id")
);
--> statement-breakpoint
CREATE TABLE "feature_media" (
	"feature_id" integer,
	"media_id" integer,
	CONSTRAINT "feature_media_pk" PRIMARY KEY("feature_id","media_id")
);
--> statement-breakpoint
CREATE TABLE "media" (
	"id" serial PRIMARY KEY,
	"storage_key" text NOT NULL,
	"content_type" text NOT NULL,
	"license" "media_license" NOT NULL,
	"owner" text DEFAULT '' NOT NULL,
	"source" text DEFAULT '' NOT NULL,
	"uploaded_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "taxon_media" (
	"taxon_id" integer,
	"media_id" integer,
	"position" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "taxon_media_pk" PRIMARY KEY("taxon_id","media_id")
);
--> statement-breakpoint
CREATE UNIQUE INDEX "character_media_character_uq" ON "character_media" ("character_id");--> statement-breakpoint
CREATE UNIQUE INDEX "feature_media_feature_uq" ON "feature_media" ("feature_id");--> statement-breakpoint
CREATE UNIQUE INDEX "media_storage_key_uq" ON "media" ("storage_key");--> statement-breakpoint
CREATE INDEX "taxon_media_taxon_idx" ON "taxon_media" ("taxon_id","position");--> statement-breakpoint
ALTER TABLE "character_media" ADD CONSTRAINT "character_media_character_id_character_id_fkey" FOREIGN KEY ("character_id") REFERENCES "character"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "character_media" ADD CONSTRAINT "character_media_media_id_media_id_fkey" FOREIGN KEY ("media_id") REFERENCES "media"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "feature_media" ADD CONSTRAINT "feature_media_feature_id_feature_id_fkey" FOREIGN KEY ("feature_id") REFERENCES "feature"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "feature_media" ADD CONSTRAINT "feature_media_media_id_media_id_fkey" FOREIGN KEY ("media_id") REFERENCES "media"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "media" ADD CONSTRAINT "media_uploaded_by_user_id_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "user"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "taxon_media" ADD CONSTRAINT "taxon_media_taxon_id_taxon_id_fkey" FOREIGN KEY ("taxon_id") REFERENCES "taxon"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "taxon_media" ADD CONSTRAINT "taxon_media_media_id_media_id_fkey" FOREIGN KEY ("media_id") REFERENCES "media"("id") ON DELETE RESTRICT;