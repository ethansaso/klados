import z from "zod";
import {
  TAXON_RANKS_DESCENDING,
  TAXON_STATUSES,
} from "../../../db/schema/schema";
import { PaginationSchema } from "../../validation/pagination";

const TaxonStatusEnum = z.enum(TAXON_STATUSES);

export const TaxonFilterSchema = z.object({
  q: z.string().optional(),
  status: TaxonStatusEnum.optional(),
  highRank: z.enum(TAXON_RANKS_DESCENDING).optional(),
  lowRank: z.enum(TAXON_RANKS_DESCENDING).optional(),
  hasMedia: z.boolean().optional(),
});

export const TaxonSearchSchema = PaginationSchema.extend(
  TaxonFilterSchema.shape
);

export type TaxonFilters = z.infer<typeof TaxonFilterSchema>;
export type TaxonSearchParams = z.infer<typeof TaxonSearchSchema>;
