ALTER TYPE "taxon_rank" ADD VALUE 'subphylum' BEFORE 'class';--> statement-breakpoint
DROP INDEX "trait_values_label_trgm_idx";--> statement-breakpoint
DROP INDEX "trait_values_label_norm_trgm_idx";