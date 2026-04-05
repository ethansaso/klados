import z from "zod";

const categoricalCharacterUpdateSchema = z.object({
  kind: z.literal("categorical"),
  characterId: z.number(),
  traitValues: z
    .array(
      z.object({
        id: z.number(),
        modifierIds: z.array(z.number()).default([]),
      }),
    )
    .nonempty(),
});

const numberCharacterUpdateSchema = z.object({
  kind: z.literal("number"),
  characterId: z.number(),
  unitId: z.int().positive().optional(),
  siBaseValue: z.number(),
  modifierIds: z.array(z.number()).default([]),
});

const rangeCharacterUpdateSchema = z
  .object({
    kind: z.literal("range"),
    characterId: z.number(),
    unitId: z.int().positive().optional(),
    siBaseMin: z.number().nullable(),
    siBaseMax: z.number().nullable(),
    modifierIds: z.array(z.number()).default([]),
  })
  .refine((d) => d.siBaseMin !== null || d.siBaseMax !== null, {
    message: "At least one bound must be set.",
    path: ["siBaseMin"],
  })
  .refine(
    (d) =>
      d.siBaseMin === null ||
      d.siBaseMax === null ||
      d.siBaseMin <= d.siBaseMax,
    { message: "Minimum must be less than or equal to maximum.", path: ["siBaseMin"] },
  );

const characterUpdateSchema = z.discriminatedUnion("kind", [
  categoricalCharacterUpdateSchema,
  numberCharacterUpdateSchema,
  rangeCharacterUpdateSchema,
]);

const featureUpdateSchema = z
  .object({
    featureId: z.number().int(),
    characters: z.array(characterUpdateSchema),
  })
  .superRefine((group, ctx) => {
    // Ensure no duplicate characterIds within the group
    const seen = new Set<number>();
    for (const c of group.characters) {
      if (seen.has(c.characterId)) {
        ctx.addIssue({
          code: "custom",
          message: `Duplicate characterId ${c.characterId} in group ${group.featureId}.`,
          path: ["characters"],
        });
      }
      seen.add(c.characterId);
    }
  });

export const groupedCharacterUpdateSchema = z
  .array(featureUpdateSchema)
  .superRefine((groups, ctx) => {
    const seenGroups = new Set<number>();

    for (const group of groups) {
      if (seenGroups.has(group.featureId)) {
        ctx.addIssue({
          code: "custom",
          message: `Duplicate featureId ${group.featureId}.`,
          path: [],
        });
      }
      seenGroups.add(group.featureId);
    }
  });

export type CategoricalCharacterUpdate = z.infer<
  typeof categoricalCharacterUpdateSchema
>;
export type NumberCharacterUpdate = z.infer<typeof numberCharacterUpdateSchema>;
export type RangeCharacterUpdate = z.infer<typeof rangeCharacterUpdateSchema>;

export type CharacterUpdate = z.infer<typeof characterUpdateSchema>;

export type CharacterGroupUpdate = z.infer<typeof featureUpdateSchema>;

export type CharacterByFeatureUpdate = z.infer<
  typeof groupedCharacterUpdateSchema
>;
