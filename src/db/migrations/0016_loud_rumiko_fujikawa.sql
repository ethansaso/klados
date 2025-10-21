CREATE TYPE "public"."character_value_type" AS ENUM('categorical', 'number', 'number_range');--> statement-breakpoint
CREATE TABLE "character_states" (
	"id" serial PRIMARY KEY NOT NULL,
	"character_id" integer NOT NULL,
	"value" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "character_states_value_canonical" CHECK ("character_states"."value" = lower(btrim(regexp_replace("character_states"."value", '[[:space:]]+', ' ', 'g'))))
);
--> statement-breakpoint
CREATE TABLE "characters" (
	"id" serial PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"label" text NOT NULL,
	"description" text,
	"value_type" character_value_type NOT NULL,
	"unit" text,
	"max_states" integer,
	"is_active" boolean DEFAULT true NOT NULL,
	"group_id" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "characters_unit_numeric_only" CHECK (
        ("characters"."value_type" IN ('number','number_range'))
        OR ("characters"."unit" IS NULL)
      ),
	CONSTRAINT "characters_max_states_categorical_only" CHECK (
        ("characters"."value_type" = 'categorical')
        OR ("characters"."max_states" IS NULL)
      ),
	CONSTRAINT "characters_max_states_min_one" CHECK ("characters"."max_states" IS NULL OR "characters"."max_states" >= 1)
);
--> statement-breakpoint
ALTER TABLE "character_states" ADD CONSTRAINT "character_states_character_id_characters_id_fk" FOREIGN KEY ("character_id") REFERENCES "public"."characters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "characters" ADD CONSTRAINT "characters_group_id_character_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."character_groups"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "character_states_character_value_uq" ON "character_states" USING btree ("character_id","value");--> statement-breakpoint
CREATE INDEX "character_states_character_idx" ON "character_states" USING btree ("character_id");--> statement-breakpoint
CREATE UNIQUE INDEX "characters_key_uq" ON "characters" USING btree ("key");