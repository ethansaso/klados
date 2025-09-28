import { createServerFn } from "@tanstack/react-start";
import { getWebRequest } from "@tanstack/react-start/server";
import { db } from "../db/client";
import { auth } from "../lib/auth/auth";
import { UserDTO } from "../routes/api/users/$username";
import { user as userTbl } from "../db/schema/auth";

type UserRow = typeof userTbl.$inferSelect;
export type CurrentUser = UserDTO & Pick<UserRow, "email" | "role">;

export const getCurrentUser = createServerFn().handler(
  async (): Promise<CurrentUser | null> => {
    const req = getWebRequest();
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session?.user?.id) return null;

    const u = await db.query.user.findFirst({
      where: (t, { eq }) => eq(t.id, session.user.id),
      columns: {
        id: true,
        username: true,
        displayUsername: true,
        name: true,
        createdAt: true,
        email: true,
        image: true,
        role: true,
        banned: true,
      },
    });

    return u ?? null;
  }
);
