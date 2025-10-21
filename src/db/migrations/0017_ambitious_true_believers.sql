CREATE TYPE "public"."name_kind" AS ENUM('common', 'scientific');--> statement-breakpoint
CREATE TYPE "public"."scientific_synonym_kind" AS ENUM('homotypic', 'heterotypic', 'misapplied');--> statement-breakpoint
CREATE TABLE "names" (
	"id" serial PRIMARY KEY NOT NULL,
	"taxon_id" integer NOT NULL,
	"kind" "name_kind" NOT NULL,
	"value" text NOT NULL,
	"locale" varchar(16),
	"is_preferred" boolean DEFAULT false NOT NULL,
	"synonym_kind" "scientific_synonym_kind",
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "names_kind_field_rules" CHECK (
        ("names"."kind" = 'common' AND "names"."locale" IS NOT NULL AND "names"."synonym_kind" IS NULL)
        OR
        ("names"."kind" = 'scientific' AND "names"."locale" IS NULL AND "names"."is_preferred" = false)
      )
);
--> statement-breakpoint
ALTER TABLE "names" ADD CONSTRAINT "names_taxon_id_taxa_id_fk" FOREIGN KEY ("taxon_id") REFERENCES "public"."taxa"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "names_taxon_idx" ON "names" USING btree ("taxon_id");--> statement-breakpoint
CREATE INDEX "names_taxon_kind_idx" ON "names" USING btree ("taxon_id","kind");--> statement-breakpoint
CREATE INDEX "names_taxon_locale_idx" ON "names" USING btree ("taxon_id","locale");--> statement-breakpoint
CREATE UNIQUE INDEX "names_accepted_scientific_uq" ON "names" USING btree ("taxon_id") WHERE "names"."kind" = 'scientific' AND "names"."synonym_kind" IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "names_preferred_common_uq" ON "names" USING btree ("taxon_id","locale") WHERE "names"."kind" = 'common' AND "names"."is_preferred" = true;--> statement-breakpoint
CREATE UNIQUE INDEX "names_value_norm_uq" ON "names" USING btree ("taxon_id","kind",coalesce("locale", ''),lower(btrim("value")));