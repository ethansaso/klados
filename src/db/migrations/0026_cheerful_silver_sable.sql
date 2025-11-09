ALTER TABLE "categorical_option_values" DROP CONSTRAINT "categorical_option_values_canonical_value_id_categorical_option_values_id_fk";
--> statement-breakpoint
ALTER TABLE "character_categorical_meta" ALTER COLUMN "is_multi_select" SET DEFAULT true;--> statement-breakpoint
ALTER TABLE "categorical_option_values" ADD CONSTRAINT "canonical_value_id_fk" FOREIGN KEY ("canonical_value_id") REFERENCES "public"."categorical_option_values"("id") ON DELETE restrict ON UPDATE no action;