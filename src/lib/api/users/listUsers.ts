import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getUsersPage } from "../../domain/users/service";
import { UsersPaginatedResult } from "../../domain/users/types";
import { PaginationSchema } from "../../validation/pagination";

/**
 * Server function to list users with pagination and optional filtering by IDs.
 */
export const listUsersFn = createServerFn({ method: "GET" })
  .inputValidator(
    PaginationSchema.extend({
      ids: z.array(z.string()).optional(),
    })
  )
  .handler(async ({ data }): Promise<UsersPaginatedResult> => {
    const { ids, page, pageSize } = data;

    const result = await getUsersPage({
      ids: ids ?? null,
      page,
      pageSize,
    });

    return result;
  });
