import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAdminMiddleware } from "../../auth/serverFnMiddleware";
import { getUsersAdminViewPage } from "../../domain/users/service";
import type { UserAdminViewPaginatedResult } from "../../domain/users/types";
import { PaginationSchema } from "../../validation/pagination";

export const listUsersAdminFn = createServerFn({ method: "GET" })
  .middleware([requireAdminMiddleware])
  .validator(
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
