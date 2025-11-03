ALTER TABLE "taxa" DROP CONSTRAINT "taxa_replaced_by_id_taxa_id_fk";
--> statement-breakpoint
ALTER TABLE "taxa" ADD CONSTRAINT "taxa_replaced_by_fk" FOREIGN KEY ("replaced_by_id") REFERENCES "public"."taxa"("id") ON DELETE set null ON UPDATE no action;