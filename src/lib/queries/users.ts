import { queryOptions } from "@tanstack/react-query";
import { getMeFn } from "../api/users/getMe";
import { getUserFn } from "../api/users/getUser";
import { listUsersAdminViewFn, listUsersFn } from "../api/users/listUsers";
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
    queryKey: ["adminUsers", { page, pageSize }],
    queryFn: () => listUsersAdminViewFn({ data: { page, pageSize: pageSize } }),
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
