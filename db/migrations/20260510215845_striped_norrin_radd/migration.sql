DROP INDEX "tcn_feature_state_char_uq";--> statement-breakpoint
DROP INDEX "tcnr_feature_state_char_uq";--> statement-breakpoint
CREATE INDEX "tcn_feature_state_char_idx" ON "taxon_character_state_number" ("taxon_feature_state_id","character_id");--> statement-breakpoint
CREATE INDEX "tcnr_feature_state_char_idx" ON "taxon_character_state_number_range" ("taxon_feature_state_id","character_id");