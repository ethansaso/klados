import z from "zod";

export const categoricalCharacterFormSchema = z.object({
  kind: z.literal("categorical"),
  characterId: z.number().int(),
  groupId: z.number().int().positive(),
  traitValues: z.array(
    z.object({
      id: z.number().int(),
      label: z.string(),
    })
  ),
});

export const characterStateFormSchema = z.discriminatedUnion("kind", [
  categoricalCharacterFormSchema,
]);

export type CharacterStateFormValue = z.infer<typeof characterStateFormSchema>;
