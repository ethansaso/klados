CREATE TYPE "affix" AS ENUM('prefix', 'suffix');--> statement-breakpoint
CREATE TYPE "modifier_type" AS ENUM('positional', 'reliability', 'contingent', 'reactive');--> statement-breakpoint
CREATE TABLE "categorical_modifier_group" (
	"id" serial PRIMARY KEY,
	"key" text NOT NULL,
	"label" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"type" "modifier_type" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "categorical_modifier_value" (
	"id" serial PRIMARY KEY,
	"group_id" serial,
	"value" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"affix_type" "affix" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "categorical_modifier_groups_key_uq" ON "categorical_modifier_group" ("key");--> statement-breakpoint
CREATE UNIQUE INDEX "categorical_modifier_values_group_id_value_uq" ON "categorical_modifier_value" ("group_id","value");--> statement-breakpoint
ALTER TABLE "categorical_modifier_value" ADD CONSTRAINT "categorical_modifier_value_sFr9EVKRjagt_fkey" FOREIGN KEY ("group_id") REFERENCES "categorical_modifier_group"("id");