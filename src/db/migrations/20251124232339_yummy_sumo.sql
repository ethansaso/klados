CREATE TYPE "numeric_character_kind" AS ENUM ('single', 'range');
CREATE TYPE "numeric_unit" AS ENUM ('um', 'mm', 'cm', 'm', 'count', 'percent');
CREATE TABLE "numeric_character_meta" (
	"character_id" integer PRIMARY KEY NOT NULL,
	"kind" numeric_character_kind NOT NULL,
	"unit" numeric_unit NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "taxon_character_number" (
	"id" serial PRIMARY KEY NOT NULL,
	"taxon_id" integer NOT NULL,
	"character_id" integer NOT NULL,
	"value_num" double precision NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tcn_value_finite" CHECK ("taxon_character_number"."value_num" = "taxon_character_number"."value_num" AND "taxon_character_number"."value_num" > '-Infinity'::float8 AND "taxon_character_number"."value_num" < 'Infinity'::float8)
);
--> statement-breakpoint
CREATE TABLE "taxon_character_number_range" (
	"id" serial PRIMARY KEY NOT NULL,
	"taxon_id" integer NOT NULL,
	"character_id" integer NOT NULL,
	"value_min" double precision NOT NULL,
	"value_max" double precision NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tcnr_min_le_max" CHECK ("taxon_character_number_range"."value_min" <= "taxon_character_number_range"."value_max"),
	CONSTRAINT "tcnr_values_finite" CHECK (
        "taxon_character_number_range"."value_min" = "taxon_character_number_range"."value_min"
        AND "taxon_character_number_range"."value_min" > '-Infinity'::float8
        AND "taxon_character_number_range"."value_min" < 'Infinity'::float8
        AND "taxon_character_number_range"."value_max" = "taxon_character_number_range"."value_max"
        AND "taxon_character_number_range"."value_max" > '-Infinity'::float8
        AND "taxon_character_number_range"."value_max" < 'Infinity'::float8
      )
);
--> statement-breakpoint
ALTER TABLE "categorical_trait_value" ADD COLUMN "hex_code" text;--> statement-breakpoint
ALTER TABLE "numeric_character_meta" ADD CONSTRAINT "numeric_character_meta_character_id_character_id_fk" FOREIGN KEY ("character_id") REFERENCES "public"."character"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "taxon_character_number" ADD CONSTRAINT "taxon_character_number_taxon_id_taxon_id_fk" FOREIGN KEY ("taxon_id") REFERENCES "public"."taxon"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "taxon_character_number" ADD CONSTRAINT "taxon_character_number_character_id_character_id_fk" FOREIGN KEY ("character_id") REFERENCES "public"."character"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "taxon_character_number_range" ADD CONSTRAINT "taxon_character_number_range_taxon_id_taxon_id_fk" FOREIGN KEY ("taxon_id") REFERENCES "public"."taxon"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "taxon_character_number_range" ADD CONSTRAINT "taxon_character_number_range_character_id_character_id_fk" FOREIGN KEY ("character_id") REFERENCES "public"."character"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "tcn_taxon_char_uq" ON "taxon_character_number" USING btree ("taxon_id","character_id");--> statement-breakpoint
CREATE INDEX "tcn_taxon_idx" ON "taxon_character_number" USING btree ("taxon_id");--> statement-breakpoint
CREATE INDEX "tcn_char_idx" ON "taxon_character_number" USING btree ("character_id");--> statement-breakpoint
CREATE UNIQUE INDEX "tcnr_taxon_char_uq" ON "taxon_character_number_range" USING btree ("taxon_id","character_id");--> statement-breakpoint
CREATE INDEX "tcnr_taxon_idx" ON "taxon_character_number_range" USING btree ("taxon_id");--> statement-breakpoint
CREATE INDEX "tcnr_char_idx" ON "taxon_character_number_range" USING btree ("character_id");--> statement-breakpoint
ALTER TABLE "categorical_trait_value" ADD CONSTRAINT "trait_values_hex_code_format_ck" CHECK ("categorical_trait_value"."hex_code" IS NULL OR "categorical_trait_value"."hex_code" ~ '^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$');