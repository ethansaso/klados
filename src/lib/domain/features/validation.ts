import z from "zod";

export const createFeatureSchema = z.object({
  label: z
    .string("Must be a string")
    .min(1, "Please provide a label.")
    .max(200, "Max 200 characters"),
  description: z
    .string("Must be a string")
    .max(1000, "Max 1000 characters")
    .optional(),
  parentId: z
    .int("Must be an integer")
    .positive("Must be positive")
    .nullable()
    .optional(),
});

export const updateFeatureMetaSchema = createFeatureSchema.partial().extend({
  id: z.int("Must be an integer").positive("Must be positive"),
});

export const updateFeatureSchema = updateFeatureMetaSchema.extend({
  characterIds: z.array(z.int().positive()).optional(),
  mediaId: z.int().positive().nullable().optional(),
});

export type CreateFeatureInput = z.infer<typeof createFeatureSchema>;
export type UpdateFeatureMetaInput = z.infer<typeof updateFeatureMetaSchema>;
export type UpdateFeatureInput = z.infer<typeof updateFeatureSchema>;
