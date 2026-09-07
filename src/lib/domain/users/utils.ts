import { v4 as uuidv4 } from "uuid";
import { extFromContentType } from "../../storage/utils";
import type { AvatarImageType } from "./validation";

/** Everything below this prefix is an avatar object we own and may delete. */
export const AVATAR_KEY_PREFIX = "avatars/";

export function createAvatarKey(
  userId: string,
  contentType: AvatarImageType,
): string {
  return `${AVATAR_KEY_PREFIX}${userId}/${uuidv4()}.${extFromContentType(contentType)}`;
}
