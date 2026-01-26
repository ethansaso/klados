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
  updates: Partial<Pick<UserDTO, "displayUsername" | "name" | "description">>,
): Promise<void> {
  await modifyUserRecord(userId, updates);
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
