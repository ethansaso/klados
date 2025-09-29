import { createFileRoute } from "@tanstack/react-router";
import { json } from "@tanstack/react-start";
import { db } from "../../../db/client";
import { user as userTbl } from "../../../db/schema/auth";
import { UserDTO } from "../../../lib/serverFns/user";

export const Route = createFileRoute("/api/users/$username")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const username = params.username?.trim().toLowerCase(); // match your normalized storage
        if (!username) {
          return json({ message: "Username is required" }, { status: 400 });
        }

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
          return json({ message: "User not found" }, { status: 404 });
        }

        const dto: UserDTO = u;
        return json(dto);
      },
    },
  },
});
