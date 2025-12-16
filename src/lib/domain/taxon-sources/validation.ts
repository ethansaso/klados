import z from "zod";
import { trimmed } from "../../validation/trimmedOptional";

/**
 * Schema for a single taxon source upsert item.
 * taxonId should be verified as identical for each item in the service layer.
 */
export const taxonSourceUpsertItemSchema = z.object({
  sourceId: z
    .number("Source ID must be a number")
    .int("Source ID must be an integer"),

  // Force accessedAt <= now
  accessedAt: z.date("Accessed at must be a valid date"),

  locator: trimmed("Locator must be a string"),
  note: trimmed("Note must be a string"),
});

export type TaxonSourceUpsertItem = z.infer<typeof taxonSourceUpsertItemSchema>;

export const setTaxonSourcesSchema = z
  .array(taxonSourceUpsertItemSchema)
  .superRefine((items, ctx) => {
    const seen = new Set<number>();
    for (let i = 0; i < items.length; i++) {
      const sourceId = items[i]!.sourceId;
      if (seen.has(sourceId)) {
        ctx.addIssue({
          code: "custom",
          message: "Duplicate sourceId in list",
          path: [i, "sourceId"],
        });
        continue;
      }
      seen.add(sourceId);
    }
  });

export type SetTaxonSourcesInput = z.infer<typeof setTaxonSourcesSchema>;
