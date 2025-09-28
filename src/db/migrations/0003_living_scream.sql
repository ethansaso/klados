CREATE TYPE "public"."name_kind" AS ENUM('common', 'scientific');--> statement-breakpoint
CREATE TYPE "public"."taxon_rank" AS ENUM('domain', 'kingdom', 'phylum', 'class', 'subclass', 'superorder', 'order', 'family', 'subfamily', 'tribe', 'genus', 'species', 'subspecies', 'variety');--> statement-breakpoint
CREATE TABLE "names" (
	"id" serial PRIMARY KEY NOT NULL,
	"taxon_id" integer NOT NULL,
	"kind" "name_kind" NOT NULL,
	"value" text NOT NULL,
	"locale" varchar(8),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "taxa" (
	"id" serial PRIMARY KEY NOT NULL,
	"parent_id" integer,
	"rank" "taxon_rank" NOT NULL,
	"canonical" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "names" ADD CONSTRAINT "names_taxon_id_taxa_id_fk" FOREIGN KEY ("taxon_id") REFERENCES "public"."taxa"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "taxa" ADD CONSTRAINT "taxa_parent_id_taxa_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."taxa"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "names_taxon_idx" ON "names" USING btree ("taxon_id");--> statement-breakpoint
CREATE INDEX "names_taxon_locale_idx" ON "names" USING btree ("taxon_id","locale");--> statement-breakpoint
CREATE INDEX "names_taxon_kind_idx" ON "names" USING btree ("taxon_id","kind");--> statement-breakpoint
CREATE INDEX "names_value_idx" ON "names" USING btree ("value");--> statement-breakpoint
CREATE INDEX "taxa_parent_idx" ON "taxa" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX "taxa_canonical_idx" ON "taxa" USING btree ("canonical");