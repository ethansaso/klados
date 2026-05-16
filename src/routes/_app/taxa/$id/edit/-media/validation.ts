import z from "zod";

export const mediaFormItemSchema = z.object({
  id: z.number().int(),
  storageKey: z.string(),
});

export type MediaFormItem = z.infer<typeof mediaFormItemSchema>;
