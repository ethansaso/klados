CREATE TABLE "unit" (
	"id" serial PRIMARY KEY NOT NULL,
	"family_id" integer NOT NULL,
	"key" text NOT NULL,
	"symbol" text NOT NULL,
	"scale" numeric(30, 18) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "units_scale_positive_ck" CHECK ("unit"."scale" > 0)
);
--> statement-breakpoint
CREATE TABLE "unit_family" (
	"id" serial PRIMARY KEY NOT NULL,
	"label" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "taxon_character_number" RENAME COLUMN "value_num" TO "si_base_value";--> statement-breakpoint
ALTER TABLE "taxon_character_number_range" RENAME COLUMN "value_min" TO "si_base_min";--> statement-breakpoint
ALTER TABLE "taxon_character_number_range" RENAME COLUMN "value_max" TO "si_base_max";--> statement-breakpoint
ALTER TABLE "taxon_character_number" DROP CONSTRAINT "tcn_value_finite";--> statement-breakpoint
ALTER TABLE "taxon_character_number_range" DROP CONSTRAINT "tcnr_min_le_max";--> statement-breakpoint
ALTER TABLE "taxon_character_number_range" DROP CONSTRAINT "tcnr_values_finite";--> statement-breakpoint
ALTER TABLE "taxon_character_number" DROP CONSTRAINT "taxon_character_number_character_id_character_id_fk";
--> statement-breakpoint
ALTER TABLE "taxon_character_number_range" DROP CONSTRAINT "taxon_character_number_range_character_id_character_id_fk";
--> statement-breakpoint
ALTER TABLE "numeric_character_meta" ADD COLUMN "unit_family_id" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "taxon_character_number" ADD COLUMN "display_unit_id" integer;--> statement-breakpoint
ALTER TABLE "taxon_character_number_range" ADD COLUMN "display_unit_id" integer;--> statement-breakpoint
ALTER TABLE "unit" ADD CONSTRAINT "unit_family_id_unit_family_id_fk" FOREIGN KEY ("family_id") REFERENCES "public"."unit_family"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "units_family_symbol_uq" ON "unit" USING btree ("family_id","symbol");--> statement-breakpoint
CREATE UNIQUE INDEX "units_family_key_uq" ON "unit" USING btree ("family_id","key");--> statement-breakpoint
CREATE INDEX "units_family_idx" ON "unit" USING btree ("family_id");--> statement-breakpoint
CREATE UNIQUE INDEX "unit_families_label_uq" ON "unit_family" USING btree ("label");--> statement-breakpoint
ALTER TABLE "numeric_character_meta" ADD CONSTRAINT "numeric_character_meta_unit_family_id_unit_family_id_fk" FOREIGN KEY ("unit_family_id") REFERENCES "public"."unit_family"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "taxon_character_number" ADD CONSTRAINT "taxon_character_number_character_id_numeric_character_meta_character_id_fk" FOREIGN KEY ("character_id") REFERENCES "public"."numeric_character_meta"("character_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "taxon_character_number" ADD CONSTRAINT "taxon_character_number_display_unit_id_unit_id_fk" FOREIGN KEY ("display_unit_id") REFERENCES "public"."unit"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "taxon_character_number_range" ADD CONSTRAINT "taxon_character_number_range_character_id_numeric_character_meta_character_id_fk" FOREIGN KEY ("character_id") REFERENCES "public"."numeric_character_meta"("character_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "taxon_character_number_range" ADD CONSTRAINT "taxon_character_number_range_display_unit_id_unit_id_fk" FOREIGN KEY ("display_unit_id") REFERENCES "public"."unit"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "numeric_meta_unit_family_idx" ON "numeric_character_meta" USING btree ("unit_family_id");--> statement-breakpoint
CREATE INDEX "tcn_display_unit_idx" ON "taxon_character_number" USING btree ("display_unit_id");--> statement-breakpoint
CREATE INDEX "tcnr_display_unit_idx" ON "taxon_character_number_range" USING btree ("display_unit_id");--> statement-breakpoint
ALTER TABLE "numeric_character_meta" DROP COLUMN "unit";--> statement-breakpoint
ALTER TABLE "taxon_character_number_range" ADD CONSTRAINT "tcnr_min_le_max_ck" CHECK ("taxon_character_number_range"."si_base_min" <= "taxon_character_number_range"."si_base_max");