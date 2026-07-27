import z from "zod";
import {
  TAXON_RANKS_DESCENDING,
  TAXON_STATUSES,
  type TaxonStatus,
} from "../../../../db/schema/schema";
import { PaginationSchema } from "../../validation/pagination";

const TaxonStatusEnum = z.enum(TAXON_STATUSES);

/** Statuses selected when the user hasn't touched the status filter. */
export const DEFAULT_TAXON_STATUSES: TaxonStatus[] = ["active"];

/**
 * Accepts a single status or a list of them, always normalizing to a list.
 * An empty list means "any status".
 */
const TaxonStatusFilter = z
  .union([TaxonStatusEnum, z.array(TaxonStatusEnum)])
  .transform((value) => (Array.isArray(value) ? value : [value]))
  .default(DEFAULT_TAXON_STATUSES)
  .catch(DEFAULT_TAXON_STATUSES);

export const TaxonFilterSchema = z.object({
  q: z.string().optional(),
  status: TaxonStatusFilter,
  highRank: z.enum(TAXON_RANKS_DESCENDING).optional(),
  lowRank: z.enum(TAXON_RANKS_DESCENDING).optional(),
  hasMedia: z.boolean().optional(),
  hasMorphology: z.boolean().optional(),
  hasEcology: z.boolean().optional(),
});

export const TaxonSearchSchema = PaginationSchema.extend(
  TaxonFilterSchema.shape,
);

/** Filters as callers may supply them (status optional / single value). */
export type TaxonFilterInput = z.input<typeof TaxonFilterSchema>;
export type TaxonFilters = z.infer<typeof TaxonFilterSchema>;
export type TaxonSearchParams = z.infer<typeof TaxonSearchSchema>;
