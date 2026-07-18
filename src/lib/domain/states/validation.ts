import z from "zod";

const categoricalCharacterUpdateSchema = z.object({
  kind: z.literal("categorical"),
  characterId: z.number(),
  traitValueId: z.number().int().positive(),
  modifierIds: z.array(z.number()).default([]),
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
    {
      message: "Minimum must be less than or equal to maximum.",
      path: ["siBaseMin"],
    },
  );

const characterUpdateSchema = z.discriminatedUnion("kind", [
  categoricalCharacterUpdateSchema,
  numberCharacterUpdateSchema,
  rangeCharacterUpdateSchema,
]);

function modifierSetSignature(modifierIds: number[]): string {
  const uniqueSorted = Array.from(new Set(modifierIds)).sort((a, b) => a - b);
  return uniqueSorted.join(",");
}

const featureUpdateSchema = z
  .object({
    featureId: z.number().int(),
    notes: z.string().trim(),
    characters: z.array(characterUpdateSchema),
  })
  .superRefine((group, ctx) => {
    // Duplicates allowed when modifier sets differ (same trait value, different modifiers = valid multi-entry)
    const seenCategorical = new Set<string>();
    // For numeric/range: track (characterId, modifierSignature) pairs to allow different modifier sets
    const seenNumericModifierSets = new Set<string>();

    for (const [idx, c] of group.characters.entries()) {
      if (c.kind === "categorical") {
        const signature = modifierSetSignature(c.modifierIds);
        const key = `${c.characterId}|${c.traitValueId}|${signature}`;
        if (seenCategorical.has(key)) {
          ctx.addIssue({
            code: "custom",
            message: `Duplicate categorical characterId ${c.characterId} in group ${group.featureId} with the same modifiers.`,
            path: ["characters", idx],
          });
        }
        seenCategorical.add(key);
      } else if (c.kind === "number" || c.kind === "range") {
        const signature = modifierSetSignature(c.modifierIds);
        const key = `${c.kind}|${c.characterId}|${signature}`;

        if (seenNumericModifierSets.has(key)) {
          const modifierText = signature.length ? signature : "none";
          ctx.addIssue({
            code: "custom",
            message:
              `Duplicate ${c.kind} state for character ${c.characterId}: ` +
              `modifier set [${modifierText}] is already used.`,
            path: ["characters", idx],
          });
        }

        seenNumericModifierSets.add(key);
      }
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
