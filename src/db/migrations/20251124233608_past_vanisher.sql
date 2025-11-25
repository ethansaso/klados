ALTER TABLE "categorical_trait_value" DROP CONSTRAINT "categorical_trait_value_set_id_categorical_trait_set_id_fk";
--> statement-breakpoint
ALTER TABLE "categorical_trait_value" ADD CONSTRAINT "categorical_trait_value_set_id_categorical_trait_set_id_fk" FOREIGN KEY ("set_id") REFERENCES "public"."categorical_trait_set"("id") ON DELETE cascade ON UPDATE no action;