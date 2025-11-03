import z from "zod";
import { TAXON_RANKS_DESCENDING } from "../../../db/schema/schema";
import { MEDIA_LICENSES } from "../../../db/utils/mediaLicense";

export const MediaItemSchema = z.object({
  url: z.url(),
  license: z.enum(MEDIA_LICENSES).optional(),
  owner: z.string().optional(),
  source: z.string().optional(),
});

export const TaxonPatchSchema = z.object({
  parent_id: z.number().nullable().optional(),
  rank: z.enum(TAXON_RANKS_DESCENDING).optional(),
  source_gbif_id: z.number().nullable().optional(),
  source_inat_id: z.number().nullable().optional(),
  media: z.array(MediaItemSchema).optional(),
  notes: z.string().nullable().optional(),
});

export type MediaItem = z.infer<typeof MediaItemSchema>;
export type TaxonPatch = z.infer<typeof TaxonPatchSchema>;
