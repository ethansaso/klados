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
    "taxon_character_number_range"."value_min" = "taxon_character_number_range"."value_min" AND "taxon_character_number_range"."value_min" > '-Infinity'::float8 AND "taxon_character_number_range"."value_min" < 'Infinity'::float8
    AND
    "taxon_character_number_range"."value_max" = "taxon_character_number_range"."value_max" AND "taxon_character_number_range"."value_max" > '-Infinity'::float8 AND "taxon_character_number_range"."value_max" < 'Infinity'::float8
  )
);
--> statement-breakpoint
CREATE TABLE "taxon_character_state" (
	"id" serial PRIMARY KEY NOT NULL,
	"taxon_id" integer NOT NULL,
	"state_id" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "taxon_character_number" ADD CONSTRAINT "taxon_character_number_taxon_id_taxa_id_fk" FOREIGN KEY ("taxon_id") REFERENCES "public"."taxa"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "taxon_character_number" ADD CONSTRAINT "taxon_character_number_character_id_characters_id_fk" FOREIGN KEY ("character_id") REFERENCES "public"."characters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "taxon_character_number_range" ADD CONSTRAINT "taxon_character_number_range_taxon_id_taxa_id_fk" FOREIGN KEY ("taxon_id") REFERENCES "public"."taxa"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "taxon_character_number_range" ADD CONSTRAINT "taxon_character_number_range_character_id_characters_id_fk" FOREIGN KEY ("character_id") REFERENCES "public"."characters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "taxon_character_state" ADD CONSTRAINT "taxon_character_state_taxon_id_taxa_id_fk" FOREIGN KEY ("taxon_id") REFERENCES "public"."taxa"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "taxon_character_state" ADD CONSTRAINT "taxon_character_state_state_id_character_states_id_fk" FOREIGN KEY ("state_id") REFERENCES "public"."character_states"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "tcn_taxon_char_uq" ON "taxon_character_number" USING btree ("taxon_id","character_id");--> statement-breakpoint
CREATE INDEX "tcn_taxon_idx" ON "taxon_character_number" USING btree ("taxon_id");--> statement-breakpoint
CREATE INDEX "tcn_char_idx" ON "taxon_character_number" USING btree ("character_id");--> statement-breakpoint
CREATE UNIQUE INDEX "tcnr_taxon_char_uq" ON "taxon_character_number_range" USING btree ("taxon_id","character_id");--> statement-breakpoint
CREATE INDEX "tcnr_taxon_idx" ON "taxon_character_number_range" USING btree ("taxon_id");--> statement-breakpoint
CREATE INDEX "tcnr_char_idx" ON "taxon_character_number_range" USING btree ("character_id");--> statement-breakpoint
CREATE UNIQUE INDEX "tcs_taxon_char_state_uq" ON "taxon_character_state" USING btree ("taxon_id","state_id");--> statement-breakpoint
CREATE INDEX "tcs_taxon_idx" ON "taxon_character_state" USING btree ("taxon_id");--> statement-breakpoint
CREATE INDEX "tcs_state_idx" ON "taxon_character_state" USING btree ("state_id");