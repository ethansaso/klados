CREATE TYPE "public"."flag_status" AS ENUM('open', 'acknowledged', 'resolved', 'dismissed');--> statement-breakpoint
CREATE TYPE "public"."taxon_flag_reason_code" AS ENUM('incorrect_data', 'outdated_taxonomy', 'duplicate_taxon', 'problematic_media', 'other');--> statement-breakpoint
CREATE TYPE "public"."user_flag_reason_code" AS ENUM('spam', 'harassment', 'inappropriate_profile', 'impersonation', 'other');--> statement-breakpoint
CREATE TABLE "taxon_flag" (
	"id" serial PRIMARY KEY NOT NULL,
	"taxon_id" integer NOT NULL,
	"reason_code" "taxon_flag_reason_code" NOT NULL,
	"created_by_user_id" text NOT NULL,
	"details" text DEFAULT '' NOT NULL,
	"status" "flag_status" DEFAULT 'open' NOT NULL,
	"resolved_by_user_id" text,
	"resolved_at" timestamp with time zone,
	"resolution_notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_flag" (
	"id" serial PRIMARY KEY NOT NULL,
	"flagged_user_id" text NOT NULL,
	"reason_code" "user_flag_reason_code" NOT NULL,
	"created_by_user_id" text NOT NULL,
	"details" text DEFAULT '' NOT NULL,
	"status" "flag_status" DEFAULT 'open' NOT NULL,
	"resolved_by_user_id" text,
	"resolved_at" timestamp with time zone,
	"resolution_notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dichotomous_key" (
	"id" serial PRIMARY KEY NOT NULL,
	"root_taxon_id" integer NOT NULL,
	"name" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "categorical_trait_value" DROP CONSTRAINT "canonical_value_same_set_fk";
--> statement-breakpoint
ALTER TABLE "taxon_flag" ADD CONSTRAINT "taxon_flag_taxon_id_taxon_id_fk" FOREIGN KEY ("taxon_id") REFERENCES "public"."taxon"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "taxon_flag" ADD CONSTRAINT "taxon_flag_created_by_user_id_user_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "taxon_flag" ADD CONSTRAINT "taxon_flag_resolved_by_user_id_user_id_fk" FOREIGN KEY ("resolved_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_flag" ADD CONSTRAINT "user_flag_flagged_user_id_user_id_fk" FOREIGN KEY ("flagged_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_flag" ADD CONSTRAINT "user_flag_created_by_user_id_user_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_flag" ADD CONSTRAINT "user_flag_resolved_by_user_id_user_id_fk" FOREIGN KEY ("resolved_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dichotomous_key" ADD CONSTRAINT "dichotomous_key_root_taxon_id_taxon_id_fk" FOREIGN KEY ("root_taxon_id") REFERENCES "public"."taxon"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "taxon_flag_taxon_idx" ON "taxon_flag" USING btree ("taxon_id");--> statement-breakpoint
CREATE INDEX "taxon_flag_created_by_idx" ON "taxon_flag" USING btree ("created_by_user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "taxon_flag_one_open_per_user_taxon_idx" ON "taxon_flag" USING btree ("created_by_user_id","taxon_id") WHERE "taxon_flag"."status" IN ('open', 'acknowledged');--> statement-breakpoint
CREATE INDEX "user_flag_flagged_user_idx" ON "user_flag" USING btree ("flagged_user_id");--> statement-breakpoint
CREATE INDEX "user_flag_created_by_idx" ON "user_flag" USING btree ("created_by_user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "user_flag_one_open_per_user_profile_idx" ON "user_flag" USING btree ("created_by_user_id","flagged_user_id") WHERE "user_flag"."status" IN ('open', 'acknowledged');--> statement-breakpoint
CREATE INDEX "dichotomous_key_root_taxon_idx" ON "dichotomous_key" USING btree ("root_taxon_id");--> statement-breakpoint
CREATE UNIQUE INDEX "dichotomous_key_root_name_uq" ON "dichotomous_key" USING btree ("root_taxon_id","name");--> statement-breakpoint
ALTER TABLE "categorical_trait_value" ADD CONSTRAINT "canonical_value_same_set_fk" FOREIGN KEY ("set_id","canonical_value_id") REFERENCES "public"."categorical_trait_value"("set_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "categorical_trait_value" ADD CONSTRAINT "trait_values_hex_code_canonical_ck" CHECK (CASE WHEN "categorical_trait_value"."is_canonical" THEN TRUE
        ELSE "categorical_trait_value"."hex_code" IS NULL END);