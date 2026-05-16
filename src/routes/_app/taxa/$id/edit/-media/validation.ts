import z from "zod";

// storageKey is a rendering concern — this schema lives in the form layer, not the domain layer.
export const mediaFormItemSchema = z.object({
  id: z.number().int(),
  storageKey: z.string(),
});

export type MediaFormItem = z.infer<typeof mediaFormItemSchema>;
