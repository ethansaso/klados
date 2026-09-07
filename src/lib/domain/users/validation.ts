import z from "zod";
import type { SupportedImageType } from "../../storage/utils";
import type { UserDTO } from "./types";

export const AVATAR_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const satisfies readonly SupportedImageType[];

export type AvatarImageType = (typeof AVATAR_IMAGE_TYPES)[number];

/** Raw bytes. */
export const MAX_AVATAR_BYTES = 2 * 1024 * 1024;
/** Base64: 3 bytes -> 4 chars w/ padding. */
const MAX_AVATAR_BASE64_CHARS = Math.ceil(MAX_AVATAR_BYTES / 3) * 4;

export const avatarUploadSchema = z.object({
  base64: z
    .string()
    .min(1)
    .max(MAX_AVATAR_BASE64_CHARS, "Image too large (max 2MB)"),
  contentType: z.enum(AVATAR_IMAGE_TYPES),
});

export const userPatchSchema = z.object({
  userId: z.string().min(1),
  name: z.string().max(100).optional(),
  description: z.string().max(500).optional(),
  /** Image replaces avatar, null removes it, absent leaves it alone. */
  avatar: avatarUploadSchema.nullish(),
});

export type AvatarUpload = z.infer<typeof avatarUploadSchema>;

/** API surface */
export type UserPatch = z.infer<typeof userPatchSchema>;
/** Domain surface */
export type EditUserUpdates = Partial<
  Pick<UserDTO, "displayUsername" | "name" | "description">
> & {
  /** Image replaces avatar, null removes it, absent leaves it alone. */
  avatar?: { body: Buffer; contentType: AvatarImageType } | null;
};
