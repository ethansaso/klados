import z from "zod";
import { TAXON_RANKS_DESCENDING } from "../../../db/schema/schema";
import { MEDIA_LICENSES } from "../../../db/utils/mediaLicense";

export const mediaItemSchema = z.object({
  url: z.url(),
  license: z.enum(MEDIA_LICENSES).optional(),
  owner: z.string().optional(),
  source: z.string().optional(),
});

export const taxonPatchSchema = z.object({
  parent_id: z.number().nullable().optional(),
  rank: z.enum(TAXON_RANKS_DESCENDING).optional(),
  source_gbif_id: z.number().nullable().optional(),
  source_inat_id: z.number().nullable().optional(),
  media: z.array(mediaItemSchema).optional(),
  notes: z.string().nullable().optional(),
});

export type MediaItem = z.infer<typeof mediaItemSchema>;
export type TaxonPatch = z.infer<typeof taxonPatchSchema>;
