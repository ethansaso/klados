import z from "zod";

// utils

function modifierSetSignature(modifierIds: number[]): string {
  const uniqueSorted = Array.from(new Set(modifierIds)).sort((a, b) => a - b);
  return uniqueSorted.join(",");
}

// misc

const modifierTokenSchema = z.object({
  id: z.number().int(),
  value: z.string(),
  affixType: z.enum(["prefix", "suffix"]),
  groupId: z.number().int(),
  groupLabel: z.string(),
});

const traitValueSchema = z.object({
  id: z.number().int().positive(),
  label: z.string(),
  hexCode: z.string().optional(),
  modifiers: z.array(modifierTokenSchema).default([]),
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
  modifiers: z.array(modifierTokenSchema).default([]),
});

export const rangeCharacterFormSchema = z.object({
  kind: z.literal("range"),
  characterId: z.number().int().positive(),
  characterLabel: z.string(),
  unit: unitSchema.nullable(), // Nullable in case of dimensionless (validated elsewhere)
  siBaseMin: z.number().nullable(),
  siBaseMax: z.number().nullable(),
  modifiers: z.array(modifierTokenSchema).default([]),
});

export const characterStateFormSchema = z.discriminatedUnion("kind", [
  categoricalCharacterFormSchema,
  numberCharacterFormSchema,
  rangeCharacterFormSchema,
]);

// features

export const featureFormSchema = z
  .object({
    featureId: z.number().int().positive(),
    featureLabel: z.string(),
    characters: z.array(characterStateFormSchema),
  })
  .superRefine((feature, ctx) => {
    const seenCategoricalByCharacter = new Set<number>();
    const seenNumericModifierSets = new Set<string>();

    for (const [idx, c] of feature.characters.entries()) {
      if (c.kind === "categorical") {
        if (seenCategoricalByCharacter.has(c.characterId)) {
          ctx.addIssue({
            code: "custom",
            message: `Duplicate categorical characterId ${c.characterId} in feature ${feature.featureId}.`,
            path: ["characters", idx],
          });
        }
        seenCategoricalByCharacter.add(c.characterId);
      }

      if (c.kind === "number" || c.kind === "range") {
        const signature = modifierSetSignature(c.modifiers.map((m) => m.id));
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

      if (c.kind === "range") {
        if (c.siBaseMin === null && c.siBaseMax === null) {
          ctx.addIssue({
            code: "custom",
            message: "At least one bound must be set.",
            path: ["characters", "siBaseMin"],
          });
        } else if (
          c.siBaseMin !== null &&
          c.siBaseMax !== null &&
          c.siBaseMin > c.siBaseMax
        ) {
          ctx.addIssue({
            code: "custom",
            message: "Minimum must be less than or equal to maximum.",
            path: ["characters", "siBaseMin"],
          });
        }
      }
    }
  });

export const groupedCharacterFormSchema = z
  .array(featureFormSchema)
  .superRefine((features, ctx) => {
    const seenFeatureIds = new Set<number>();

    for (const feature of features) {
      if (seenFeatureIds.has(feature.featureId)) {
        ctx.addIssue({
          code: "custom",
          message: `Duplicate featureId ${feature.featureId}.`,
          path: [],
        });
      }
      seenFeatureIds.add(feature.featureId);
    }
  });

// types

export type ModifierTokenFormValue = z.infer<typeof modifierTokenSchema>;

export type CharacterStateFormValue = z.infer<typeof characterStateFormSchema>;

export type FeatureFormValue = z.infer<typeof featureFormSchema>;

export type GroupedCharacterFormValue = z.infer<
  typeof groupedCharacterFormSchema
>;
