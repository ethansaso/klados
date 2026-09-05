ALTER TABLE "modifier_value" DROP CONSTRAINT "canonical_modifier_same_group_fk";--> statement-breakpoint
ALTER TABLE "modifier_value" DROP CONSTRAINT "modifier_values_group_id_id_uq";--> statement-breakpoint
ALTER TABLE "modifier_value" DROP CONSTRAINT "modifier_values_no_self_alias_ck";--> statement-breakpoint
ALTER TABLE "modifier_value" DROP CONSTRAINT "modifier_values_description_canonical_ck";--> statement-breakpoint
DROP INDEX "modifier_values_canonical_target_idx";--> statement-breakpoint
ALTER TABLE "modifier_value" DROP COLUMN "canonical_value_id";