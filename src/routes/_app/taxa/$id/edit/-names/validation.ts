import z from "zod";
import { nameItemSchema } from "../../../../../../lib/domain/taxon-names/validation";

// Necessary to avoid excess rerenders
export const nameItemFormSchema = nameItemSchema.extend({
  _formId: z.string(),
});

export type NameItemForm = z.infer<typeof nameItemFormSchema>;
