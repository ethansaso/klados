import z from "zod";

const categoricalCharacterUpdateSchema = z.object({
  kind: z.literal("categorical"),
  characterId: z.number(),
  traitValueIds: z.array(z.number()).nonempty(),
});

const numberCharacterUpdateSchema = z.object({
  kind: z.literal("number"),
  characterId: z.number(),
  unitId: z.int().positive().optional(),
  siBaseValue: z.number(),
});

const rangeCharacterUpdateSchema = z
  .object({
    kind: z.literal("range"),
    characterId: z.number(),
    unitId: z.int().positive().optional(),
    siBaseMin: z.number(),
    siBaseMax: z.number(),
  })
  .refine((data) => data.siBaseMin <= data.siBaseMax, {
    message: "Minimum must be less than or equal to maximum.",
    path: ["siBaseMin", "siBaseMax"],
  });

export const characterUpdateSchema = z.discriminatedUnion("kind", [
  categoricalCharacterUpdateSchema,
  numberCharacterUpdateSchema,
  rangeCharacterUpdateSchema,
]);

export type CategoricalCharacterUpdate = z.infer<
  typeof categoricalCharacterUpdateSchema
>;
export type NumberCharacterUpdate = z.infer<typeof numberCharacterUpdateSchema>;
export type RangeCharacterUpdate = z.infer<typeof rangeCharacterUpdateSchema>;

export type CharacterUpdate = z.infer<typeof characterUpdateSchema>;
