import { createFileRoute } from "@tanstack/react-router";
import { json } from "@tanstack/react-start";
import { getUser, UserDTO } from "../../../lib/serverFns/user";

export const Route = createFileRoute("/api/users/$username")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const username = params.username?.trim().toLowerCase();

        const user = await getUser({ data: { id: username } });

        return json(user);
      },
    },
  },
});
