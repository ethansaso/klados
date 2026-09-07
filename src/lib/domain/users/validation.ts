import z from "zod";
import type { SupportedImageType } from "../../storage/utils";

export const AVATAR_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const satisfies readonly SupportedImageType[];

export type AvatarImageType = (typeof AVATAR_IMAGE_TYPES)[number];

export const userPatchSchema = z.object({
  userId: z.string().min(1),
  name: z.string().max(100).optional(),
  description: z.string().max(500).optional(),
});

export type UserPatch = z.infer<typeof userPatchSchema>;
