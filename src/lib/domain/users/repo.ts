import { asc, count, inArray, SQL } from "drizzle-orm";
import { db } from "../../../db/client";
import { user as userTbl } from "../../../db/schema/schema";
import { UserDTO, UsersPaginatedResult } from "./types";

export type ListUsersParams = {
  ids?: string[] | null;
  page: number;
  pageSize: number;
};

export async function listUsersPage(
  params: ListUsersParams
): Promise<UsersPaginatedResult> {
  const { ids, page, pageSize } = params;
  const offset = (page - 1) * pageSize;

  const predicate: SQL | undefined =
    ids && ids.length ? inArray(userTbl.id, ids) : undefined;

  const items: UserDTO[] = await db
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
}

export async function findUserByIdOrUsername(
  idOrUsername: string
): Promise<UserDTO | null> {
  const user = await db.query.user.findFirst({
    where: (t, { eq, or }) =>
      or(eq(t.id, idOrUsername), eq(t.username, idOrUsername)),
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

  return user ?? null;
}
