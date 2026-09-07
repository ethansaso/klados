import { v4 as uuidv4 } from "uuid";
import { extFromContentType } from "../media/utils";
import type { AvatarImageType } from "./validation";

export function createAvatarKey(
  userId: string,
  contentType: AvatarImageType,
): string {
  return `avatars/${userId}/${uuidv4()}.${extFromContentType(contentType)}`;
}
