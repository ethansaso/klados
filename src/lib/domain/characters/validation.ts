import z from "zod";

export const createCharacterSchema = z.object({
  key: z
    .string("Must be a string")
    .min(1, "Key is required")
    .max(100, "Max 100 characters"),
  label: z
    .string("Must be a string")
    .min(1, "Label is required.")
    .max(200, "Max 200 characters"),
  description: z
    .string("Must be a string")
    .max(1000, "Max 1000 characters")
    .optional(),
  groupId: z.int("Must be an integer").positive(),
  traitSetId: z.int("Must be an integer").positive(),
  isMultiSelect: z.boolean("Must be a boolean"),
});

export type CreateCharacterInput = z.infer<typeof createCharacterSchema>;
