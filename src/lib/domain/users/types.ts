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

export interface UsersPaginatedResult extends PaginatedResult {
  items: UserDTO[];
}
