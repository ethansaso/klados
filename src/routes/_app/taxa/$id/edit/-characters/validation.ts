import z from "zod";

// leaves

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

// chars

export const categoricalCharacterFormSchema = z.object({
  kind: z.literal("categorical"),
  characterId: z.number().int().positive(),
  characterLabel: z.string(),
  traitValues: z.array(traitValueSchema),
});

export const numberCharacterFormSchema = z.object({
  kind: z.literal("number"),
  characterId: z.number().int().positive(),
  characterLabel: z.string(),
  unit: unitSchema.nullable(), // Nullable in case of dimensionless (validated elsewhere)
  siBaseValue: z.number(),
});

export const rangeCharacterFormSchema = z
  .object({
    kind: z.literal("range"),
    characterId: z.number().int().positive(),
    characterLabel: z.string(),
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

// groups

export const characterGroupFormSchema = z
  .object({
    groupId: z.number().int().positive(),
    groupLabel: z.string(),
    characters: z.array(characterStateFormSchema),
  })
  .superRefine((group, ctx) => {
    // Enforce unique characterId within a group
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

export const groupedCharacterFormSchema = z
  .array(characterGroupFormSchema)
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

// types

export type CharacterStateFormValue = z.infer<typeof characterStateFormSchema>;

export type CharacterGroupFormValue = z.infer<typeof characterGroupFormSchema>;

export type GroupedCharacterFormValue = z.infer<
  typeof groupedCharacterFormSchema
>;
