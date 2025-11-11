import z from "zod";

export const createCharacterSchema = z.object({
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
  groupId: z.number("Must be a number").int().positive(),
  traitSetId: z.number("Must be a number").int().positive(),
  isMultiSelect: z.boolean("Must be a boolean"),
});

export type CreateCharacterInput = z.infer<typeof createCharacterSchema>;
