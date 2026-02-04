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

const characterUpdateSchema = z.discriminatedUnion("kind", [
  categoricalCharacterUpdateSchema,
  numberCharacterUpdateSchema,
  rangeCharacterUpdateSchema,
]);

const characterGroupUpdateSchema = z
  .object({
    groupId: z.number().int(),
    characters: z.array(characterUpdateSchema),
  })
  .superRefine((group, ctx) => {
    // Ensure no duplicate characterIds within the group
    const seen = new Set<number>();
    for (const c of group.characters) {
      if (seen.has(c.characterId)) {
        ctx.addIssue({
          code: "custom",
          message: `Duplicate characterId ${c.characterId} in group ${group.groupId}.`,
          path: ["characters"],
        });
      }
      seen.add(c.characterId);
    }
  });

export const groupedCharacterUpdateSchema = z
  .array(characterGroupUpdateSchema)
  .superRefine((groups, ctx) => {
    const seenGroups = new Set<number>();
    const seenCharacters = new Map<number, number>(); // characterId -> groupId

    for (const group of groups) {
      if (seenGroups.has(group.groupId)) {
        ctx.addIssue({
          code: "custom",
          message: `Duplicate groupId ${group.groupId}.`,
          path: [],
        });
      }
      seenGroups.add(group.groupId);

      for (const c of group.characters) {
        const prevGroup = seenCharacters.get(c.characterId);
        if (prevGroup !== undefined) {
          ctx.addIssue({
            code: "custom",
            message: `Character ${c.characterId} appears in multiple groups (${prevGroup}, ${group.groupId}).`,
            path: [],
          });
        }
        seenCharacters.set(c.characterId, group.groupId);
      }
    }
  });

export type CategoricalCharacterUpdate = z.infer<
  typeof categoricalCharacterUpdateSchema
>;
export type NumberCharacterUpdate = z.infer<typeof numberCharacterUpdateSchema>;
export type RangeCharacterUpdate = z.infer<typeof rangeCharacterUpdateSchema>;

export type CharacterUpdate = z.infer<typeof characterUpdateSchema>;

export type CharacterGroupUpdate = z.infer<typeof characterGroupUpdateSchema>;

export type GroupedCharacterUpdate = z.infer<
  typeof groupedCharacterUpdateSchema
>;
