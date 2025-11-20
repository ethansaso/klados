import z from "zod";
import { TAXON_RANKS_DESCENDING } from "../../../db/schema/schema";
import { MEDIA_LICENSES } from "../../../db/utils/mediaLicense";
import { nameItemSchema } from "../taxon-names/validation";

export const mediaItemSchema = z.object({
  url: z.url(),
  license: z.enum(MEDIA_LICENSES).optional(),
  owner: z.string().optional(),
  source: z.string().optional(),
});

const categoricalCharacterUpdateSchema = z.object({
  kind: z.literal("categorical"),
  characterId: z.number(),
  traitValueIds: z.array(z.number()).nonempty(),
});

export const characterUpdateSchema = z.discriminatedUnion("kind", [
  categoricalCharacterUpdateSchema,
  // TODO: numericCharacterUpdate,
  // TODO: rangeCharacterUpdate,
]);

export const taxonPatchSchema = z.object({
  parent_id: z.number("parent_id must be a number").nullable().optional(),
  rank: z.enum(TAXON_RANKS_DESCENDING).optional(),
  source_gbif_id: z
    .number("If provided, source_gbif_id must be a number")
    .nullable()
    .optional(),
  source_inat_id: z
    .number("If provided, source_inat_id must be a number")
    .nullable()
    .optional(),
  media: z.array(mediaItemSchema).optional(),
  notes: z.string("notes must be a string").optional(),
  names: z.array(nameItemSchema).optional(),
  characters: z.array(characterUpdateSchema).optional(),
});

export const createTaxonSchema = z.object({
  accepted_name: z
    .string("Accepted name must be a string.")
    .nonempty("Accepted name is required"),
  parent_id: z.int("Must be an integer").nullable(),
  rank: z.enum(TAXON_RANKS_DESCENDING),
});

export type MediaItem = z.infer<typeof mediaItemSchema>;
export type TaxonPatch = z.infer<typeof taxonPatchSchema>;
export type CreateTaxonInput = z.infer<typeof createTaxonSchema>;
export type CharacterUpdate = z.infer<typeof characterUpdateSchema>;
export type CategoricalCharacterUpdate = z.infer<
  typeof categoricalCharacterUpdateSchema
>;
