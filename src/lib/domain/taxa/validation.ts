import z from "zod";
import { TAXON_RANKS_DESCENDING } from "../../../../db/schema/schema";
import { groupedCharacterUpdateSchema } from "../states/validation";
import { nameItemSchema } from "../taxon-names/validation";
import { setTaxonSourcesSchema } from "../taxon-sources/validation";

export const taxonPatchSchema = z.object({
  parentId: z.number().int().nullable().optional(),
  rank: z.enum(TAXON_RANKS_DESCENDING).optional(),
  sourceGbifId: z.number().int().nullable().optional(),
  sourceInatId: z.number().int().nullable().optional(),
  mediaIds: z.array(z.number().int()).optional(),
  notes: z.string().optional(),
});

export const updateTaxonInputSchema = taxonPatchSchema
  .extend({
    id: z.number().int(),

    // subresources
    names: z.array(nameItemSchema).optional(),
    states: groupedCharacterUpdateSchema.optional(),
    sources: setTaxonSourcesSchema.optional(),
  })
  .superRefine((data, ctx) => {
    const { id, ...rest } = data;
    void id;

    const hasAny = Object.values(rest).some((v) => v !== undefined);
    if (!hasAny) {
      ctx.addIssue({
        code: "custom",
        message: "At least one field must be provided.",
        path: [],
      });
    }

    if (data.parentId != null && data.parentId === data.id) {
      ctx.addIssue({
        code: "custom",
        message: "A taxon's parent cannot be itself.",
        path: ["parentId"],
      });
    }
  });

export const createTaxonSchema = z.object({
  acceptedName: z
    .string("Accepted name must be a string.")
    .nonempty("Accepted name is required"),
  parentId: z.int("Must be an integer").nullable(),
  rank: z.enum(TAXON_RANKS_DESCENDING),
});

export type TaxonPatch = z.infer<typeof taxonPatchSchema>;
export type CreateTaxonInput = z.infer<typeof createTaxonSchema>;
export type UpdateTaxonInput = z.infer<typeof updateTaxonInputSchema>;
