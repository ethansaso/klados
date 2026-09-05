import z from "zod";
import { AFFIX_TYPES } from "../../../../db/schema/schema";

export const createModifierGroupSchema = z.object({
  label: z
    .string("Must be a string")
    .min(1, "Please provide a label.")
    .max(200, "Max 200 characters"),
  description: z
    .string("Must be a string")
    .max(1000, "Max 1000 characters")
    .optional(),
});

export const createModifierSchema = z.object({
  groupId: z.number().int().positive(),
  label: z
    .string("Must be a string")
    .min(1, "Please provide a label.")
    .max(200, "Max 200 characters"),
  description: z
    .string("Must be a string")
    .max(1000, "Max 1000 characters")
    .optional(),
  affixType: z.enum(
    AFFIX_TYPES,
    `Invalid affix type; must be one of ${Object.values(AFFIX_TYPES).join(", ")}`,
  ),
  mediaId: z.coerce.number().int().positive().nullable().optional(),
});

export const updateModifierSchema = z.object({
  id: z.number().int().positive(),
  label: z
    .string("Must be a string")
    .min(1, "Please provide a value.")
    .max(200, "Max 200 characters")
    .optional(),
  description: z
    .string("Must be a string")
    .max(1000, "Max 1000 characters")
    .optional(),
  affixType: z
    .enum(
      AFFIX_TYPES,
      `Invalid affix type; must be one of ${Object.values(AFFIX_TYPES).join(", ")}`,
    )
    .optional(),
  mediaId: z.coerce.number().int().positive().nullable().optional(),
});

export type CreateModifierGroupInput = z.infer<
  typeof createModifierGroupSchema
>;
export type CreateModifierInput = z.infer<typeof createModifierSchema>;
export type UpdateModifierInput = z.infer<typeof updateModifierSchema>;
