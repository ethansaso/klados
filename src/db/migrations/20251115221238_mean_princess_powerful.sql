ALTER TABLE "taxon_name" DROP CONSTRAINT "names_kind_field_rules";--> statement-breakpoint
DROP INDEX "names_sci_accepted_idx";--> statement-breakpoint
DROP INDEX "names_accepted_scientific_uq";--> statement-breakpoint
CREATE INDEX "names_sci_accepted_idx" ON "taxon_name" USING btree ("taxon_id") WHERE "taxon_name"."kind" = 'scientific' AND "taxon_name"."is_preferred" = true;--> statement-breakpoint
CREATE UNIQUE INDEX "names_accepted_scientific_uq" ON "taxon_name" USING btree ("taxon_id") WHERE "taxon_name"."kind" = 'scientific' AND "taxon_name"."is_preferred" = true;--> statement-breakpoint
ALTER TABLE "taxon_name" DROP COLUMN "synonym_kind";--> statement-breakpoint
ALTER TABLE "taxon_name" ADD CONSTRAINT "names_kind_field_rules" CHECK (
        (
          "taxon_name"."kind" = 'common'
          AND "taxon_name"."locale" IS NOT NULL
        )
        OR
        (
          "taxon_name"."kind" = 'scientific'
          AND "taxon_name"."locale" IS NULL
        )
      );--> statement-breakpoint
DROP TYPE "public"."scientific_synonym_kind";