import z from "zod";
import {
  trimmedNonEmpty,
  trimmedOptional,
  trimmedUrlOptional,
} from "../../validation/trimmedOptional";

export const sourceItemSchema = z.object({
  name: trimmedNonEmpty("Source name is required"),

  authors: trimmedOptional("Authors must be a string"),
  publisher: trimmedOptional("Publisher must be a string"),
  note: trimmedOptional("Note must be a string"),

  isbn: trimmedOptional("ISBN must be a string"),
  url: trimmedUrlOptional("URL must be a valid URL"),
  publicationYear: z.coerce
    .number<number | undefined>("Publication year must be a number")
    .int("Publication year must be an integer")
    .min(1400, "Publication year must be after 1400")
    .max(2500, "Publication year must be before 2500")
    .optional(),
});

export type SourceItem = z.infer<typeof sourceItemSchema>;
