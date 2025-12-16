CREATE TABLE "source" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"authors" text DEFAULT '' NOT NULL,
	"publisher" text DEFAULT '' NOT NULL,
	"isbn" text,
	"url" text,
	"publication_year" integer,
	"note" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "source_name_not_empty" CHECK (btrim("source"."name") <> ''),
	CONSTRAINT "source_publication_year_sane" CHECK ("source"."publication_year" IS NULL OR ("source"."publication_year" >= 1400 AND "source"."publication_year" <= 2500))
);
--> statement-breakpoint
CREATE TABLE "taxon_source" (
	"id" serial PRIMARY KEY NOT NULL,
	"taxon_id" integer NOT NULL,
	"source_id" integer NOT NULL,
	"accessed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"locator" text DEFAULT '' NOT NULL,
	"note" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "taxon_source_locator_trimmed_ck" CHECK ("taxon_source"."locator" = '' OR btrim("taxon_source"."locator") <> '')
);
--> statement-breakpoint
ALTER TABLE "taxon_source" ADD CONSTRAINT "taxon_source_taxon_id_taxon_id_fk" FOREIGN KEY ("taxon_id") REFERENCES "public"."taxon"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "taxon_source" ADD CONSTRAINT "taxon_source_source_id_source_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."source"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "source_isbn_uq" ON "source" USING btree ("isbn") WHERE "source"."isbn" IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "source_url_uq" ON "source" USING btree ("url") WHERE "source"."url" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "source_pub_year_idx" ON "source" USING btree ("publication_year");--> statement-breakpoint
CREATE INDEX "source_name_trgm_lower_idx" ON "source" USING gin (lower("name") gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "source_authors_trgm_lower_idx" ON "source" USING gin (lower("authors") gin_trgm_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "taxon_source_uq" ON "taxon_source" USING btree ("taxon_id","source_id");--> statement-breakpoint
CREATE INDEX "taxon_source_taxon_idx" ON "taxon_source" USING btree ("taxon_id");--> statement-breakpoint
CREATE INDEX "taxon_source_source_idx" ON "taxon_source" USING btree ("source_id");--> statement-breakpoint
CREATE INDEX "taxon_source_accessed_at_idx" ON "taxon_source" USING btree ("accessed_at");