import z from "zod";
import { trimmed, trimmedNonEmpty } from "../../validation/trimmedOptional";

export const updateTraitValueSchema = z.object({
  id: z.number().int().positive(),
  characterId: z.number().int().positive(),

  key: trimmedNonEmpty("Please provide a key.", {
    max: { value: 100, message: "Max 100 characters" },
  }).optional(),
  label: trimmedNonEmpty("Please provide a label.", {
    max: { value: 200, message: "Max 200 characters" },
  }).optional(),
  description: trimmed("Must be a string")
    .max(1000, "Max 1000 characters")
    .optional(),
  hexCode: z
    .string("Must be a string")
    .trim()
    .regex(
      /^#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})$/,
      "Must be a valid hex color code",
    )
    .nullable()
    .optional(),
  aliasTargetId: z.number().int().positive().nullable().optional(),
});

export type UpdateTraitValueInput = z.infer<typeof updateTraitValueSchema>;
