import z from "zod";

export const nameItemSchema = z.object({
  value: z
    .string("Name value must be a string")
    .min(1, "Name value cannot be empty"),
  locale: z
    .string("Locale must be a string")
    .min(1, "Locale cannot be empty")
    .max(16, "Locale cannot exceed 16 characters"),
  isPreferred: z.boolean("isPreferred must be a boolean"),
});

export type NameItem = z.infer<typeof nameItemSchema>;
