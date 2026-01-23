import { user as userTbl } from "../../../db/schema/auth";
import { PaginatedResult } from "../../validation/pagination";

type UserRow = typeof userTbl.$inferSelect;
export type UserDTO = Pick<
  UserRow,
  | "id"
  | "username"
  | "displayUsername"
  | "name"
  | "image"
  | "createdAt"
  | "banned"
  | "role"
  | "description"
>;
export type UserAdminViewDTO = UserDTO &
  Pick<UserRow, "email" | "emailVerified" | "banReason" | "banExpires">;

export type UserPaginatedResult = PaginatedResult<UserDTO>;
export type UserAdminViewPaginatedResult = PaginatedResult<UserAdminViewDTO>;
