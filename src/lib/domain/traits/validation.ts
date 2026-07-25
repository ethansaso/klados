import z from "zod";
import { trimmed, trimmedNonEmpty } from "../../validation/trimmedOptional";

const traitId = z.number().int().positive();

const label = trimmedNonEmpty("Please provide a label.", {
  max: { value: 200, message: "Max 200 characters" },
});

const description = trimmed("Must be a string")
  .max(1000, "Max 1000 characters")
  .optional();

/* `null` clears the swatch. */
const hexCode = z
  .string("Must be a string")
  .trim()
  .regex(/^#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})$/, "Must be a valid hex color code")
  .nullable()
  .optional();

export const createTraitValueSchema = z.object({
  characterId: z.number().int().positive(),
  label,
  description,
  hexCode,
  synonymOfTraitId: traitId.optional(),
});

export const updateTraitValueSchema = z.object({
  id: traitId,
  characterId: z.number().int().positive(),
  label: label.optional(),
  description,
  hexCode,
});

export const linkTraitsAsSynonymsSchema = z.object({
  traitIdA: traitId,
  traitIdB: traitId,
});

export const unlinkTraitFromSynonymsSchema = z.object({
  traitId,
});

export type CreateTraitValueInput = z.infer<typeof createTraitValueSchema>;
export type UpdateTraitValueInput = z.infer<typeof updateTraitValueSchema>;
export type LinkTraitsAsSynonymsInput = z.infer<
  typeof linkTraitsAsSynonymsSchema
>;
export type UnlinkTraitFromSynonymsInput = z.infer<
  typeof unlinkTraitFromSynonymsSchema
>;
