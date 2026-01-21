import z from "zod";

const traitValueSchema = z.object({
  id: z.number().int().positive(),
  label: z.string(),
  hexCode: z.string().optional(),
});

const unitSchema = z.object({
  id: z.number().int().positive(),
  symbol: z.string(),
  scale: z.string(),
});

export const categoricalCharacterFormSchema = z.object({
  kind: z.literal("categorical"),
  characterId: z.number().int().positive(),
  characterLabel: z.string(),
  groupId: z.number().int().positive(),
  groupLabel: z.string(),
  traitValues: z.array(traitValueSchema),
});

export const numberCharacterFormSchema = z.object({
  kind: z.literal("number"),
  characterId: z.number().int().positive(),
  characterLabel: z.string(),
  groupId: z.number().int().positive(),
  groupLabel: z.string(),
  unit: unitSchema.nullable(), // Nullable in case of dimensionless (validated elsewhere)
  siBaseValue: z.number(),
});

export const rangeCharacterFormSchema = z
  .object({
    kind: z.literal("range"),
    characterId: z.number().int().positive(),
    characterLabel: z.string(),
    groupId: z.number().int().positive(),
    groupLabel: z.string(),
    unit: unitSchema.nullable(), // Nullable in case of dimensionless (validated elsewhere)
    siBaseMin: z.number(),
    siBaseMax: z.number(),
  })
  .refine((data) => data.siBaseMin <= data.siBaseMax, {
    message: "Minimum must be less than or equal to maximum.",
    path: ["siBaseMin"],
  });

export const characterStateFormSchema = z.discriminatedUnion("kind", [
  categoricalCharacterFormSchema,
  numberCharacterFormSchema,
  rangeCharacterFormSchema,
]);

export type CharacterStateFormValue = z.infer<typeof characterStateFormSchema>;
