import z from "zod";

export const createTraitSetSchema = z.object({
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
});

export type CreateTraitSetInput = z.infer<typeof createTraitSetSchema>;
