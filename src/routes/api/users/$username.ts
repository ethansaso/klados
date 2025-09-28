import { createServerFileRoute } from "@tanstack/react-start/server";
import { db } from "../../../db/client";
import { user as userTbl } from "../../../db/schema/auth";

type UserRow = typeof userTbl.$inferSelect;
export type UserDTO = Pick<UserRow, "id" | "username" | "displayUsername" | "name" | "image" | "createdAt" | "banned">;

export const ServerRoute = createServerFileRoute(
  "/api/users/$username"
).methods({
  GET: async ({ params }) => {
    const { username } = params;
    const u = await db.query.user.findFirst({
      where: (t, { eq }) => eq(t.username, username),
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

    if (!u) {
      return new Response(JSON.stringify({ message: "User not found" }), {
        status: 404,
        headers: { "content-type": "application/json" },
      });
    }

    return new Response(JSON.stringify(u), {
      headers: { "content-type": "application/json" },
    });
  },
});
