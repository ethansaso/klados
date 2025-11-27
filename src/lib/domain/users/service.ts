import { findUserByIdOrUsername, listUsersPage, ListUsersParams } from "./repo";
import { UserDTO, UsersPaginatedResult } from "./types";

export async function getUsersPage(
  params: ListUsersParams
): Promise<UsersPaginatedResult> {
  return listUsersPage(params);
}

export async function getUserByIdOrUsername(
  idOrUsername: string
): Promise<UserDTO | null> {
  return findUserByIdOrUsername(idOrUsername);
}
