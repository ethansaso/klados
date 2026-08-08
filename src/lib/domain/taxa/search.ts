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

/** Feature ID(s) a taxon must carry (either explicitly or as implied by subfeatures). */
const TaxonFeatureFilter = z
  .union([z.array(z.coerce.number().int()), z.coerce.number().int()])
  .transform((value) => (Array.isArray(value) ? value : [value]))
  .default([])
  .catch([]);

const CategoricalStateFilter = z.object({
  k: z.literal("c"),
  f: z.coerce.number().int().optional(),
  c: z.coerce.number().int(),
  t: z.coerce.number().int(),
});

const NumericStateFilter = z.object({
  k: z.literal("n"),
  f: z.coerce.number().int().optional(),
  c: z.coerce.number().int(),
  /** Omitted for dimensionless characters (a spore count is not 4 of anything). */
  u: z.coerce.number().int().optional(),
  v: z.coerce.number(),
});

/**
 * Character states a taxon must carry.
 * Malformed entries dropped w/o throwing.
 * ! Keys terse to keep URLs small.
 *
 *   k  kind: "c"ategorical or "n"umeric
 *   f  featureId — optionally narrows to specific feature's characters
 *   c  characterId
 *   t  traitValueId (categorical)
 *   u  unitId of `v` (numeric); absent when the character is dimensionless
 *   v  value as typed
 */
const TaxonCharacterFilter = z
  .array(
    z
      .discriminatedUnion("k", [CategoricalStateFilter, NumericStateFilter])
      .nullable()
      .catch(null),
  )
  .transform((tokens) => tokens.filter((token) => token !== null))
  .default([])
  .catch([]);

export const TaxonFilterSchema = z.object({
  q: z.string().optional(),
  status: TaxonStatusFilter,
  highRank: z.enum(TAXON_RANKS_DESCENDING).optional(),
  lowRank: z.enum(TAXON_RANKS_DESCENDING).optional(),
  hasMedia: z.boolean().optional(),
  hasMorphology: z.boolean().optional(),
  hasEcology: z.boolean().optional(),
  features: TaxonFeatureFilter,
  characters: TaxonCharacterFilter,
});

export const TaxonSearchSchema = PaginationSchema.extend(
  TaxonFilterSchema.shape,
);

/** Filters as callers may supply them (status optional / single value). */
export type TaxonFilterInput = z.input<typeof TaxonFilterSchema>;
export type TaxonFilters = z.infer<typeof TaxonFilterSchema>;
export type TaxonSearchParams = z.infer<typeof TaxonSearchSchema>;
export type CategoricalStateFilterToken = z.infer<
  typeof CategoricalStateFilter
>;
export type NumericStateFilterToken = z.infer<typeof NumericStateFilter>;
export type CharacterStateFilterToken =
  CategoricalStateFilterToken | NumericStateFilterToken;
