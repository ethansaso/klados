CREATE TABLE "categorical_option_sets" (
	"id" serial PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"label" text NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "categorical_option_values" (
	"id" serial PRIMARY KEY NOT NULL,
	"set_id" integer NOT NULL,
	"key" text NOT NULL,
	"label" text NOT NULL,
	"is_canonical" boolean DEFAULT true NOT NULL,
	"canonical_value_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "option_values_role_consistency_ck" CHECK (CASE WHEN "categorical_option_values"."is_canonical" THEN "categorical_option_values"."canonical_value_id" IS NULL
        ELSE "categorical_option_values"."canonical_value_id" IS NOT NULL END),
	CONSTRAINT "option_values_no_self_alias_ck" CHECK ("categorical_option_values"."canonical_value_id" IS NULL OR "categorical_option_values"."canonical_value_id" <> "categorical_option_values"."id")
);
--> statement-breakpoint
CREATE TABLE "character_categorical_meta" (
	"character_id" integer PRIMARY KEY NOT NULL,
	"option_set_id" integer NOT NULL,
	"is_multi_select" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "character_value_categorical" (
	"id" serial PRIMARY KEY NOT NULL,
	"taxon_id" integer NOT NULL,
	"character_id" integer NOT NULL,
	"option_value_id" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "character_states" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "taxon_character_number" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "taxon_character_number_range" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "taxon_character_state" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "character_states" CASCADE;--> statement-breakpoint
DROP TABLE "taxon_character_number" CASCADE;--> statement-breakpoint
DROP TABLE "taxon_character_number_range" CASCADE;--> statement-breakpoint
DROP TABLE "taxon_character_state" CASCADE;--> statement-breakpoint
ALTER TABLE "characters" DROP CONSTRAINT "characters_unit_numeric_only";--> statement-breakpoint
ALTER TABLE "characters" DROP CONSTRAINT "characters_max_states_categorical_only";--> statement-breakpoint
ALTER TABLE "characters" DROP CONSTRAINT "characters_max_states_min_one";--> statement-breakpoint
ALTER TABLE "categorical_option_values" ADD CONSTRAINT "categorical_option_values_set_id_categorical_option_sets_id_fk" FOREIGN KEY ("set_id") REFERENCES "public"."categorical_option_sets"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "categorical_option_values" ADD CONSTRAINT "categorical_option_values_canonical_value_id_categorical_option_values_id_fk" FOREIGN KEY ("canonical_value_id") REFERENCES "public"."categorical_option_values"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "character_categorical_meta" ADD CONSTRAINT "character_categorical_meta_character_id_characters_id_fk" FOREIGN KEY ("character_id") REFERENCES "public"."characters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "character_categorical_meta" ADD CONSTRAINT "character_categorical_meta_option_set_id_categorical_option_sets_id_fk" FOREIGN KEY ("option_set_id") REFERENCES "public"."categorical_option_sets"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "character_value_categorical" ADD CONSTRAINT "character_value_categorical_taxon_id_taxa_id_fk" FOREIGN KEY ("taxon_id") REFERENCES "public"."taxa"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "character_value_categorical" ADD CONSTRAINT "character_value_categorical_character_id_characters_id_fk" FOREIGN KEY ("character_id") REFERENCES "public"."characters"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "character_value_categorical" ADD CONSTRAINT "character_value_categorical_option_value_id_categorical_option_values_id_fk" FOREIGN KEY ("option_value_id") REFERENCES "public"."categorical_option_values"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "option_sets_key_uq" ON "categorical_option_sets" USING btree ("key");--> statement-breakpoint
CREATE UNIQUE INDEX "option_values_set_key_uq" ON "categorical_option_values" USING btree ("set_id","key");--> statement-breakpoint
CREATE INDEX "option_values_set_idx" ON "categorical_option_values" USING btree ("set_id");--> statement-breakpoint
CREATE INDEX "option_values_canonical_target_idx" ON "categorical_option_values" USING btree ("canonical_value_id");--> statement-breakpoint
CREATE UNIQUE INDEX "tcv_cat_unique" ON "character_value_categorical" USING btree ("taxon_id","character_id","option_value_id");--> statement-breakpoint
CREATE INDEX "tcv_cat_taxon_idx" ON "character_value_categorical" USING btree ("taxon_id");--> statement-breakpoint
CREATE INDEX "tcv_cat_character_idx" ON "character_value_categorical" USING btree ("character_id");--> statement-breakpoint
CREATE INDEX "tcv_cat_option_idx" ON "character_value_categorical" USING btree ("option_value_id");--> statement-breakpoint
CREATE INDEX "characters_group_idx" ON "characters" USING btree ("group_id");--> statement-breakpoint
ALTER TABLE "character_groups" DROP COLUMN "is_active";--> statement-breakpoint
ALTER TABLE "characters" DROP COLUMN "value_type";--> statement-breakpoint
ALTER TABLE "characters" DROP COLUMN "unit";--> statement-breakpoint
ALTER TABLE "characters" DROP COLUMN "max_states";--> statement-breakpoint
ALTER TABLE "characters" DROP COLUMN "is_active";--> statement-breakpoint
DROP TYPE "public"."character_value_type";