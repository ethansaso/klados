ALTER TABLE "names" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "names" CASCADE;--> statement-breakpoint
ALTER TABLE "taxa" DROP CONSTRAINT "taxa_parent_id_taxa_id_fk";
--> statement-breakpoint
ALTER TABLE "taxa" ADD CONSTRAINT "taxa_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."taxa"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
DROP TYPE "public"."name_kind";