import z from "zod";

const categoricalCharacterUpdateSchema = z.object({
  kind: z.literal("categorical"),
  characterId: z.number(),
  traitValueIds: z.array(z.number()).nonempty(),
});

export const characterUpdateSchema = z.discriminatedUnion("kind", [
  categoricalCharacterUpdateSchema,
  // TODO: numericCharacterUpdate,
  // TODO: rangeCharacterUpdate,
]);

export type CategoricalCharacterUpdate = z.infer<
  typeof categoricalCharacterUpdateSchema
>;
