import { queryOptions } from "@tanstack/react-query";
import { listUsers, getUser } from "../serverFns/user";
import type { UserDTO, UsersPageResult } from "../serverFns/user";

/**
 * Query options for fetching multiple users.
 * Wraps the getUsers server function with React Query integration.
 */
export const usersQueryOptions = (page: number, pageSize: number) =>
  queryOptions({
    queryKey: ["users", { page, pageSize }],
    queryFn: () => listUsers({ data: { page, pageSize } }) as Promise<UsersPageResult>,
  });
  
/**
 * Query options for fetching a single user by ID.
 */
export const userQueryOptions = (id: string) =>
  queryOptions({
    queryKey: ["users", id],
    queryFn: () => getUser({ data: { id } }) as Promise<UserDTO | undefined>,
  });
