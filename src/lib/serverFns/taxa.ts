import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { db } from "../../db/client";
import { asc, count, inArray, SQL } from "drizzle-orm";
import { userSessionMiddleware } from "../auth/middleware";
import { taxa as taxaTbl } from "../../db/schema/taxa/taxa";
import { PaginatedResult } from "./returnTypes";

type TaxonRow = typeof taxaTbl.$inferSelect;
export type TaxonDTO = Pick<
  TaxonRow,
  | "id"
  | "rank"
>;

export interface TaxonPageResult extends PaginatedResult {
  items: TaxonDTO[];
};

export const listUsers = createServerFn({ method: "GET" })
  .inputValidator(
    z.object({
      ids: z.array(z.string()).optional(),
      page: z.number().int().min(1).default(1),
      pageSize: z.number().int().min(1).max(100).default(20),
    })
  )
  .handler(async ({ data }): Promise<UsersPageResult> => {
    const { ids, page, pageSize } = data;
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
  .handler(async ({ data }): Promise<UserDTO | undefined> => {
    const { id } = data;

    const u = await db.query.user.findFirst({
      where: (t, { eq, or }) =>
        or(eq(t.id, id), eq(t.username, id)),
      columns: {
        id: true,
        username: true,
        displayUsername: true,
        name: true,
        image: true,
        createdAt: true,
        banned: true,
      },
    });

    return u;
  });

export const getMe = createServerFn({ method: "GET" })
  .middleware([userSessionMiddleware])
  .handler(async ({ context }) => {
    return context.user;
  });