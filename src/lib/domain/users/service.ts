import { storage } from "../../storage";
import {
  findUserByIdOrUsername,
  listUsersAdminViewPage,
  listUsersPage,
  type ListUsersParams,
  modifyUserRecord,
  setUserBanned,
  setUserUnbanned,
} from "./repo";
import type {
  UserAdminViewPaginatedResult,
  UserDTO,
  UserPaginatedResult,
} from "./types";
import { AVATAR_KEY_PREFIX, createAvatarKey } from "./utils";
import type { AvatarImageType, EditUserUpdates } from "./validation";

export async function getUsersPage(
  params: ListUsersParams,
): Promise<UserPaginatedResult> {
  return listUsersPage(params);
}

export async function getUsersAdminViewPage(
  params: ListUsersParams,
): Promise<UserAdminViewPaginatedResult> {
  return listUsersAdminViewPage(params);
}

export async function getUserByIdOrUsername(
  idOrUsername: string,
): Promise<UserDTO | null> {
  return findUserByIdOrUsername(idOrUsername);
}

export async function editUser(
  userId: string,
  updates: EditUserUpdates,
): Promise<void> {
  const { avatar, ...fields } = updates;

  if (avatar === undefined) {
    await modifyUserRecord(userId, fields);
    return;
  }

  const current = await findUserByIdOrUsername(userId);
  if (!current) throw new Error("User not found.");

  const image = avatar ? await uploadAvatarObject(userId, avatar) : null;

  await modifyUserRecord(userId, { ...fields, image });
  await discardAvatarObject(current.image);
}

export async function banUser(
  userId: string,
  options?: {
    banReason?: string;
    banExpires?: Date;
  },
): Promise<void> {
  await setUserBanned(userId, {
    banReason: options?.banReason,
    banExpires: options?.banExpires,
  });
}

export async function unbanUser(userId: string): Promise<void> {
  await setUserUnbanned(userId);
}

/** Ignores failures. Has no effect on non-stored avatars (e.g. OAuth). */
async function discardAvatarObject(image: string | null): Promise<void> {
  if (!image?.startsWith(AVATAR_KEY_PREFIX)) return;

  try {
    await storage.delete(image);
  } catch (err: unknown) {
    console.error(`[avatar] failed to delete ${image}:`, err);
  }
}

/** Writes the object and returns its key; the caller persists it. */
async function uploadAvatarObject(
  userId: string,
  avatar: { body: Buffer; contentType: AvatarImageType },
): Promise<string> {
  const key = createAvatarKey(userId, avatar.contentType);

  await storage.upload({
    key,
    body: avatar.body,
    contentType: avatar.contentType,
    cacheControl: "public, max-age=31536000, immutable",
  });

  return key;
}
