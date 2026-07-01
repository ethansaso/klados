import z from "zod";
import { AFFIX_TYPES, MODIFIER_CLASSES } from "../../../../db/schema/schema";

export const createModifierGroupSchema = z.object({
  label: z
    .string("Must be a string")
    .min(1, "Please provide a label.")
    .max(200, "Max 200 characters"),
  description: z
    .string("Must be a string")
    .max(1000, "Max 1000 characters")
    .optional(),
  class: z.enum(
    MODIFIER_CLASSES,
    `Invalid modifier class; must be one of ${Object.values(MODIFIER_CLASSES).join(", ")}`,
  ),
});

export const createModifierSchema = z.object({
  groupId: z.number().int().positive(),
  value: z
    .string("Must be a string")
    .min(1, "Please provide a value.")
    .max(200, "Max 200 characters"),
  description: z
    .string("Must be a string")
    .max(1000, "Max 1000 characters")
    .optional(),
  affixType: z.enum(
    AFFIX_TYPES,
    `Invalid affix type; must be one of ${Object.values(AFFIX_TYPES).join(", ")}`,
  ),
});

export const updateModifierSchema = z.object({
  id: z.number().int().positive(),
  value: z
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
  aliasTargetId: z.coerce.number().int().positive().nullable().optional(),
});

export type CreateModifierGroupInput = z.infer<
  typeof createModifierGroupSchema
>;
export type CreateModifierInput = z.infer<typeof createModifierSchema>;
export type UpdateModifierInput = z.infer<typeof updateModifierSchema>;
