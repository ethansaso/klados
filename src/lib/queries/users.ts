import { queryOptions } from "@tanstack/react-query";
import type { UserDTO, UsersPageResult } from "../api/users/user";
import { getMe, getUser, listUsers } from "../api/users/user";

/**
 * Query options for fetching multiple users.
 * Wraps the getUsers server function with React Query integration.
 */
export const usersQueryOptions = (page: number, pageSize: number) =>
  queryOptions<UsersPageResult>({
    queryKey: ["users", { page, pageSize }],
    queryFn: () => listUsers({ data: { page, pageSize: pageSize } }),
    staleTime: 60_000,
  });

/**
 * Query options for fetching a single user by ID.
 */
export const userQueryOptions = (id: string) =>
  queryOptions<UserDTO>({
    queryKey: ["user", id],
    queryFn: () => getUser({ data: { id } }),
    staleTime: 60_000,
  });

/**
 * Query options for fetching the current authenticated user.
 */
export const meQuery = () => {
  return queryOptions({
    queryKey: ["me"],
    queryFn: getMe,
    staleTime: 60_000,
    gcTime: 5 * 60_000,
  });
};
