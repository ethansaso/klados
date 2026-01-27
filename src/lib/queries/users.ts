import { queryOptions } from "@tanstack/react-query";
import { getMeFn } from "../api/users/getMeFn";
import { getUserFn } from "../api/users/getUserFn";
import { listUsersAdminFn } from "../api/users/listUsersAdminFn";
import { listUsersFn } from "../api/users/listUsersFn";
import type {
  UserAdminViewPaginatedResult,
  UserDTO,
  UserPaginatedResult,
} from "../domain/users/types";

/**
 * Query options for fetching multiple users.
 * Wraps the getUsers server function with React Query integration.
 */
export const usersQueryOptions = (page: number, pageSize: number) =>
  queryOptions<UserPaginatedResult>({
    queryKey: ["users", { page, pageSize }],
    queryFn: () => listUsersFn({ data: { page, pageSize: pageSize } }),
    staleTime: 60_000,
  });

/**
 * Admin-view Query options for fetching multiple users.
 * Admin middleware enforced inside server fn.
 */
export const usersAdminViewQueryOptions = (page: number, pageSize: number) =>
  queryOptions<UserAdminViewPaginatedResult>({
    queryKey: ["users", "admin", { page, pageSize }],
    queryFn: () => listUsersAdminFn({ data: { page, pageSize: pageSize } }),
    staleTime: 60_000,
  });

/**
 * Query options for fetching a single user by ID.
 */
export const userQueryOptions = (id: string) =>
  queryOptions<UserDTO>({
    queryKey: ["user", id],
    queryFn: () => getUserFn({ data: { id } }),
    staleTime: 60_000,
  });

/**
 * Query options for fetching the current authenticated user.
 */
export const meQueryOptions = () => {
  return queryOptions({
    queryKey: ["me"],
    queryFn: () => getMeFn(),
    staleTime: 60_000,
    gcTime: 5 * 60_000,
  });
};
