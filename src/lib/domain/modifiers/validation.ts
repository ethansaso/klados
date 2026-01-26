import z from "zod";
import { MODIFIER_CLASSES } from "../../../db/schema/schema";

export const createModifierGroupSchema = z.object({
  key: z
    .string("Must be a string")
    .min(1, "Please provide a key.")
    .max(100, "Max 100 characters"),
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

export type CreateModifierGroupInput = z.infer<
  typeof createModifierGroupSchema
>;
