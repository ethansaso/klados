CREATE TYPE "public"."role" AS ENUM('user', 'curator', 'admin');--> statement-breakpoint
CREATE TYPE "public"."name_kind" AS ENUM('common', 'scientific');--> statement-breakpoint
CREATE TYPE "public"."scientific_synonym_kind" AS ENUM('homotypic', 'heterotypic', 'misapplied');--> statement-breakpoint
CREATE TYPE "public"."taxon_rank" AS ENUM('domain', 'kingdom', 'phylum', 'class', 'subclass', 'superorder', 'order', 'family', 'subfamily', 'tribe', 'genus', 'species', 'subspecies', 'variety');--> statement-breakpoint
CREATE TYPE "public"."taxon_status" AS ENUM('draft', 'active', 'deprecated');--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	"impersonated_by" text,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"username" text NOT NULL,
	"display_username" text,
	"role" "role" DEFAULT 'user' NOT NULL,
	"banned" boolean DEFAULT false,
	"ban_reason" text,
	"ban_expires" timestamp,
	CONSTRAINT "user_email_unique" UNIQUE("email"),
	CONSTRAINT "user_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "categorical_trait_set" (
	"id" serial PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"label" text NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "categorical_trait_value" (
	"id" serial PRIMARY KEY NOT NULL,
	"set_id" integer NOT NULL,
	"key" text NOT NULL,
	"label" text NOT NULL,
	"is_canonical" boolean DEFAULT true NOT NULL,
	"canonical_value_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "trait_values_role_consistency_ck" CHECK (CASE WHEN "categorical_trait_value"."is_canonical" THEN "categorical_trait_value"."canonical_value_id" IS NULL
        ELSE "categorical_trait_value"."canonical_value_id" IS NOT NULL END),
	CONSTRAINT "trait_values_no_self_alias_ck" CHECK ("categorical_trait_value"."canonical_value_id" IS NULL OR "categorical_trait_value"."canonical_value_id" <> "categorical_trait_value"."id")
);
--> statement-breakpoint
CREATE TABLE "categorical_character_meta" (
	"character_id" integer PRIMARY KEY NOT NULL,
	"trait_set_id" integer NOT NULL,
	"is_multi_select" boolean NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "character" (
	"id" serial PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"label" text NOT NULL,
	"description" text,
	"group_id" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "character_group" (
	"id" serial PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"label" text NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "taxon_character_state_categorical" (
	"id" serial PRIMARY KEY NOT NULL,
	"taxon_id" integer NOT NULL,
	"character_id" integer NOT NULL,
	"trait_value_id" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "taxon_name" (
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
        ("taxon_name"."kind" = 'common' AND "taxon_name"."locale" IS NOT NULL AND "taxon_name"."synonym_kind" IS NULL)
        OR
        ("taxon_name"."kind" = 'scientific' AND "taxon_name"."locale" IS NULL AND "taxon_name"."is_preferred" = false)
      )
);
--> statement-breakpoint
CREATE TABLE "taxon" (
	"id" serial PRIMARY KEY NOT NULL,
	"parent_id" integer,
	"replaced_by_id" integer,
	"rank" "taxon_rank" NOT NULL,
	"status" "taxon_status" DEFAULT 'draft' NOT NULL,
	"source_gbif_id" integer,
	"source_inat_id" integer,
	"media" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "taxa_parent_not_self" CHECK ("taxon"."parent_id" IS NULL OR "taxon"."parent_id" <> "taxon"."id")
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "categorical_trait_value" ADD CONSTRAINT "categorical_trait_value_set_id_categorical_trait_set_id_fk" FOREIGN KEY ("set_id") REFERENCES "public"."categorical_trait_set"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "categorical_trait_value" ADD CONSTRAINT "canonical_value_same_set_fk" FOREIGN KEY ("set_id","canonical_value_id") REFERENCES "public"."categorical_trait_value"("set_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "categorical_character_meta" ADD CONSTRAINT "categorical_character_meta_character_id_character_id_fk" FOREIGN KEY ("character_id") REFERENCES "public"."character"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "categorical_character_meta" ADD CONSTRAINT "categorical_character_meta_trait_set_id_categorical_trait_set_id_fk" FOREIGN KEY ("trait_set_id") REFERENCES "public"."categorical_trait_set"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "character" ADD CONSTRAINT "character_group_id_character_group_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."character_group"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "taxon_character_state_categorical" ADD CONSTRAINT "taxon_character_state_categorical_taxon_id_taxon_id_fk" FOREIGN KEY ("taxon_id") REFERENCES "public"."taxon"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "taxon_character_state_categorical" ADD CONSTRAINT "taxon_character_state_categorical_character_id_character_id_fk" FOREIGN KEY ("character_id") REFERENCES "public"."character"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "taxon_character_state_categorical" ADD CONSTRAINT "taxon_character_state_categorical_trait_value_id_categorical_trait_value_id_fk" FOREIGN KEY ("trait_value_id") REFERENCES "public"."categorical_trait_value"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "taxon_name" ADD CONSTRAINT "taxon_name_taxon_id_taxon_id_fk" FOREIGN KEY ("taxon_id") REFERENCES "public"."taxon"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "taxon" ADD CONSTRAINT "taxa_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."taxon"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "taxon" ADD CONSTRAINT "taxa_replaced_by_fk" FOREIGN KEY ("replaced_by_id") REFERENCES "public"."taxon"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "trait_sets_key_uq" ON "categorical_trait_set" USING btree ("key");--> statement-breakpoint
CREATE UNIQUE INDEX "trait_values_set_id_id_uq" ON "categorical_trait_value" USING btree ("set_id","id");--> statement-breakpoint
CREATE UNIQUE INDEX "trait_values_set_key_uq" ON "categorical_trait_value" USING btree ("set_id","key");--> statement-breakpoint
CREATE INDEX "trait_values_set_idx" ON "categorical_trait_value" USING btree ("set_id");--> statement-breakpoint
CREATE INDEX "trait_values_canonical_target_idx" ON "categorical_trait_value" USING btree ("canonical_value_id") WHERE "categorical_trait_value"."canonical_value_id" IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "characters_key_uq" ON "character" USING btree ("key");--> statement-breakpoint
CREATE INDEX "characters_group_idx" ON "character" USING btree ("group_id");--> statement-breakpoint
CREATE UNIQUE INDEX "character_groups_key_uq" ON "character_group" USING btree ("key");--> statement-breakpoint
CREATE UNIQUE INDEX "tcs_cat_unique" ON "taxon_character_state_categorical" USING btree ("taxon_id","character_id","trait_value_id");--> statement-breakpoint
CREATE INDEX "tcs_cat_taxon_idx" ON "taxon_character_state_categorical" USING btree ("taxon_id");--> statement-breakpoint
CREATE INDEX "tcs_cat_character_idx" ON "taxon_character_state_categorical" USING btree ("character_id");--> statement-breakpoint
CREATE INDEX "tcs_cat_trait_idx" ON "taxon_character_state_categorical" USING btree ("trait_value_id");--> statement-breakpoint
CREATE INDEX "tcs_cat_character_trait_idx" ON "taxon_character_state_categorical" USING btree ("character_id","trait_value_id");--> statement-breakpoint
CREATE INDEX "names_taxon_idx" ON "taxon_name" USING btree ("taxon_id");--> statement-breakpoint
CREATE INDEX "names_taxon_kind_idx" ON "taxon_name" USING btree ("taxon_id","kind");--> statement-breakpoint
CREATE INDEX "names_taxon_locale_idx" ON "taxon_name" USING btree ("taxon_id","locale");--> statement-breakpoint
CREATE INDEX "names_sci_accepted_idx" ON "taxon_name" USING btree ("taxon_id") WHERE "taxon_name"."kind" = 'scientific' AND "taxon_name"."synonym_kind" IS NULL;--> statement-breakpoint
CREATE INDEX "names_value_trgm_lower_idx" ON "taxon_name" USING gin (lower("value") gin_trgm_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "names_accepted_scientific_uq" ON "taxon_name" USING btree ("taxon_id") WHERE "taxon_name"."kind" = 'scientific' AND "taxon_name"."synonym_kind" IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "names_preferred_common_uq" ON "taxon_name" USING btree ("taxon_id","locale") WHERE "taxon_name"."kind" = 'common' AND "taxon_name"."is_preferred" = true;--> statement-breakpoint
CREATE UNIQUE INDEX "names_value_norm_uq" ON "taxon_name" USING btree ("taxon_id","kind",coalesce("locale", ''),lower(btrim("value")));--> statement-breakpoint
CREATE INDEX "taxa_parent_idx" ON "taxon" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX "taxa_rank_idx" ON "taxon" USING btree ("rank");--> statement-breakpoint
CREATE UNIQUE INDEX "taxa_source_gbif_uq" ON "taxon" USING btree ("source_gbif_id") WHERE "taxon"."source_gbif_id" IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "taxa_source_inat_uq" ON "taxon" USING btree ("source_inat_id") WHERE "taxon"."source_inat_id" IS NOT NULL;