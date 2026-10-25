import z from "zod";
import { FEATURE_SEMANTICS } from "../../../../../db/schema/schema";
import {
  createFeatureSchema,
  updateFeatureSchema,
} from "../../../../lib/domain/features/validation";

/** Includes label for UI concerns */
const refSchema = z.object({
  id: z.int("Must be an integer").positive("Must be positive"),
  label: z
    .string("Must be a string")
    .min(1, "Please provide a label.")
    .max(200, "Max 200 characters"),
});

export const createFeatureFormSchema = createFeatureSchema
  .omit({ parentId: true })
  .extend({
    parent: refSchema.nullable().optional(),
  })
  .superRefine(requireParentForVariant);

export const updateFeatureFormSchema = updateFeatureSchema
  .omit({ parentId: true, characterIds: true })
  .extend({
    parent: refSchema.nullable(),
    characters: z.array(refSchema),
    semantics: z.enum(FEATURE_SEMANTICS),
  })
  .superRefine(requireParentForVariant);

export type CreateFeatureFormInput = z.infer<typeof createFeatureFormSchema>;
export type UpdateFeatureFormInput = z.infer<typeof updateFeatureFormSchema>;

/** Variants are alternatives among siblings, so they need a parent. */
function requireParentForVariant(
  values: { semantics?: string; parent?: unknown },
  ctx: z.RefinementCtx,
) {
  if (values.semantics === "variant" && !values.parent) {
    ctx.addIssue({
      code: "custom",
      path: ["semantics"],
      message: "Variants need a parent feature",
    });
  }
}
