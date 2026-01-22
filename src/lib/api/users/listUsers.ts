import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAdminMiddleware } from "../../auth/serverFnMiddleware";
import {
  getUsersAdminViewPage,
  getUsersPage,
} from "../../domain/users/service";
import {
  UserAdminViewPaginatedResult,
  UserPaginatedResult,
} from "../../domain/users/types";
import { PaginationSchema } from "../../validation/pagination";

/**
 * Server function to list users with pagination and optional filtering by IDs.
 */
export const listUsersFn = createServerFn({ method: "GET" })
  .inputValidator(
    PaginationSchema.extend({
      ids: z.array(z.string()).optional(),
    }),
  )
  .handler(async ({ data }): Promise<UserPaginatedResult> => {
    const { ids, page, pageSize } = data;

    const result = await getUsersPage({
      ids: ids ?? null,
      page,
      pageSize,
    });

    return result;
  });

export const listUsersAdminViewFn = createServerFn({ method: "GET" })
  .middleware([requireAdminMiddleware])
  .inputValidator(
    PaginationSchema.extend({
      ids: z.array(z.string()).optional(),
    }),
  )
  .handler(async ({ data }): Promise<UserAdminViewPaginatedResult> => {
    const { ids, page, pageSize } = data;

    const result = await getUsersAdminViewPage({
      ids: ids ?? null,
      page,
      pageSize,
    });

    return result;
  });
