import z from "zod";
import { updateFeatureSchema } from "../../../../lib/domain/features/validation";

const refSchema = z.object({
  id: z.int("Must be an integer").positive("Must be positive"),
  label: z
    .string("Must be a string")
    .min(1, "Please provide a label.")
    .max(200, "Max 200 characters"),
});

export const updateFeatureFormSchema = updateFeatureSchema
  .omit({ parentId: true, characterIds: true })
  .extend({
    parent: refSchema.nullable(),
    characters: z.array(refSchema),
  });

export type UpdateFeatureFormInput = z.infer<typeof updateFeatureFormSchema>;
