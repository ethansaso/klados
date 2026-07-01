ALTER TABLE "categorical_modifier_group" RENAME TO "modifier_group";--> statement-breakpoint
ALTER TABLE "categorical_modifier_value" RENAME TO "modifier_value";--> statement-breakpoint
ALTER INDEX "categorical_modifier_groups_label_uq" RENAME TO "modifier_groups_label_uq";--> statement-breakpoint
ALTER INDEX "categorical_modifier_values_group_id_value_uq" RENAME TO "modifier_values_group_id_value_uq";