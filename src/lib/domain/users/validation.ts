import z from "zod";

export const userPatchSchema = z.object({
  userId: z.string().min(1),
  name: z.string().max(100).optional(),
  description: z.string().max(500).optional(),
});

export type UserPatch = z.infer<typeof userPatchSchema>;
