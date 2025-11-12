import { notFound } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { asc, count, inArray, SQL } from "drizzle-orm";
import { z } from "zod";
import { db } from "../../db/client";
import { user as userTbl } from "../../db/schema/auth";
import { userSessionMiddleware } from "../auth/serverFnMiddleware";
import { PaginatedResult, PaginationSchema } from "../validation/pagination";

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
>;

export interface UsersPageResult extends PaginatedResult {
  items: UserDTO[];
}

export const listUsers = createServerFn({ method: "GET" })
  .inputValidator(
    PaginationSchema.extend({
      ids: z.array(z.string()).optional(),
    })
  )
  .handler(async ({ data }): Promise<UsersPageResult> => {
    const { ids, page, pageSize: pageSize } = data;
    const offset = (page - 1) * pageSize;

    const predicate: SQL | undefined =
      ids && ids.length ? inArray(userTbl.id, ids) : undefined;

    const items = await db
      .select({
        id: userTbl.id,
        username: userTbl.username,
        displayUsername: userTbl.displayUsername,
        name: userTbl.name,
        image: userTbl.image,
        createdAt: userTbl.createdAt,
        banned: userTbl.banned,
        role: userTbl.role,
      })
      .from(userTbl)
      .where(predicate)
      .orderBy(asc(userTbl.username))
      .limit(pageSize)
      .offset(offset);

    // Total count with the same predicate
    const [{ total }] = await db
      .select({ total: count() })
      .from(userTbl)
      .where(predicate);

    return {
      items,
      page,
      pageSize,
      total,
    };
  });

/**
 * Server function to get a single user by ID.
 */
export const getUser = createServerFn({
  method: "GET",
})
  .inputValidator(
    z.object({
      id: z.string(),
    })
  )
  .handler(async ({ data }): Promise<UserDTO> => {
    const { id } = data;

    const u = await db.query.user.findFirst({
      where: (t, { eq, or }) => or(eq(t.id, id), eq(t.username, id)),
      columns: {
        id: true,
        username: true,
        displayUsername: true,
        name: true,
        image: true,
        createdAt: true,
        banned: true,
        role: true,
      },
    });

    if (!u) {
      throw notFound();
    }
    return u;
  });

export const getMe = createServerFn({ method: "GET" })
  .middleware([userSessionMiddleware])
  .handler(async ({ context }) => {
    const u = context.user;
    return u;
  });
