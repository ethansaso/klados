import z from "zod";

const baseCharacterFields = z.object({
  label: z
    .string("Must be a string")
    .min(1, "Label is required.")
    .max(200, "Max 200 characters"),
  description: z
    .string("Must be a string")
    .max(1000, "Max 1000 characters")
    .optional(),
});

const createCategoricalCharacterFields = baseCharacterFields.extend({
  type: z.literal("categorical"),
  isMultiSelect: z.boolean("Must be a boolean"),
});
const createNumberCharacterFields = baseCharacterFields.extend({
  type: z.literal("number"),
  unitFamilyId: z.int("Must be an integer").positive(),
});
const createRangeCharacterFields = baseCharacterFields.extend({
  type: z.literal("range"),
  unitFamilyId: z.int("Must be an integer").positive(),
});

export const createCharacterSchema = z.discriminatedUnion("type", [
  createCategoricalCharacterFields,
  createNumberCharacterFields,
  createRangeCharacterFields,
]);

export const updateCharacterSchema = baseCharacterFields.partial().extend({
  id: z.int("Must be an integer").positive("Must be positive"),
  isMultiSelect: z.boolean().optional(),
  mediaId: z.int().positive().nullable().optional(),
});

export type CreateCategoricalCharacterInput = z.infer<
  typeof createCategoricalCharacterFields
>;
export type CreateNumberCharacterInput = z.infer<
  typeof createNumberCharacterFields
>;
export type CreateRangeCharacterInput = z.infer<
  typeof createRangeCharacterFields
>;
export type CreateCharacterInput = z.infer<typeof createCharacterSchema>;

export type UpdateCharacterInput = z.infer<typeof updateCharacterSchema>;
