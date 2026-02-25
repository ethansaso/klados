ALTER TABLE "categorical_modifier_value" ADD COLUMN "canonical_value_id" integer;--> statement-breakpoint
ALTER TABLE "categorical_modifier_value" ADD CONSTRAINT "modifier_values_group_id_id_uq" UNIQUE("group_id","id");--> statement-breakpoint
CREATE INDEX "modifier_values_canonical_target_idx" ON "categorical_modifier_value" ("canonical_value_id") WHERE "canonical_value_id" IS NOT NULL;--> statement-breakpoint
ALTER TABLE "categorical_modifier_value" ADD CONSTRAINT "canonical_modifier_same_group_fk" FOREIGN KEY ("group_id","canonical_value_id") REFERENCES "categorical_modifier_value"("group_id","id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "categorical_modifier_value" ADD CONSTRAINT "modifier_values_no_self_alias_ck" CHECK ("canonical_value_id" IS NULL OR "canonical_value_id" <> "id");--> statement-breakpoint
ALTER TABLE "categorical_modifier_value" ADD CONSTRAINT "modifier_values_description_canonical_ck" CHECK ("canonical_value_id" IS NULL OR "description" = '');