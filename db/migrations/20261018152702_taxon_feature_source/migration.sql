CREATE TABLE "taxon_feature_source" (
	"taxon_id" integer,
	"feature_id" integer,
	"source_id" integer,
	CONSTRAINT "taxon_feature_source_pk" PRIMARY KEY("taxon_id","feature_id","source_id")
);
--> statement-breakpoint
CREATE INDEX "taxon_feature_source_source_idx" ON "taxon_feature_source" ("taxon_id","source_id");--> statement-breakpoint
ALTER TABLE "taxon_feature_source" ADD CONSTRAINT "taxon_feature_source_feature_fk" FOREIGN KEY ("taxon_id","feature_id") REFERENCES "taxon_feature_state"("taxon_id","feature_id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "taxon_feature_source" ADD CONSTRAINT "taxon_feature_source_source_fk" FOREIGN KEY ("taxon_id","source_id") REFERENCES "taxon_source"("taxon_id","source_id") ON DELETE CASCADE;