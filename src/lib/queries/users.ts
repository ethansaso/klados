import { queryOptions } from "@tanstack/react-query";
import type {
  UserAdminViewPaginatedResult,
  UserDTO,
  UserPaginatedResult,
} from "../domain/users/types";
import { getMeFn } from "../server-fns/users/getMeFn";
import { getUserFn } from "../server-fns/users/getUserFn";
import { listUsersAdminFn } from "../server-fns/users/listUsersAdminFn";
import { listUsersFn } from "../server-fns/users/listUsersFn";

/**
 * Query options for fetching multiple users.
 * Wraps the getUsers server function with React Query integration.
 */
export const usersQueryOptions = (page: number, pageSize: number) =>
  queryOptions<UserPaginatedResult>({
    queryKey: ["users", { page, pageSize }],
    queryFn: () => listUsersFn({ data: { page, pageSize } }),
  });

/**
 * Admin-view Query options for fetching multiple users.
 * Admin middleware enforced inside server fn.
 */
export const usersAdminViewQueryOptions = (page: number, pageSize: number) =>
  queryOptions<UserAdminViewPaginatedResult>({
    queryKey: ["users", "admin", { page, pageSize }],
    queryFn: () => listUsersAdminFn({ data: { page, pageSize } }),
  });

/**
 * Query options for fetching a single user by ID.
 */
export const userQueryOptions = (id: string) =>
  queryOptions<UserDTO>({
    queryKey: ["users", id],
    queryFn: () => getUserFn({ data: { id } }),
  });

/**
 * Query options for fetching the current authenticated user.
 */
export const meQueryOptions = () => {
  return queryOptions({
    queryKey: ["users", "me"],
    queryFn: () => getMeFn(),
    gcTime: 5 * 60_000,
  });
};
