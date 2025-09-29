import { createFileRoute } from "@tanstack/react-router";
import { json } from "@tanstack/react-start";
import { listUsers } from "../../../lib/serverFns/user";

export const Route = createFileRoute("/api/users/")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const sp = new URL(request.url).searchParams;

        const ids = sp.get("ids")
          ?.split(",")
          .map((s) => s.trim())
          .filter(Boolean);

        const result = await listUsers({
          data: {
            ids,
            page: sp.get("page") ? Number(sp.get("page")) : undefined,
            pageSize:
              (sp.get("pageSize") ?? sp.get("page_size"))
                ? Number(sp.get("pageSize") ?? sp.get("page_size"))
                : undefined,
          },
        });

        return json(result);
      },
    },
  },
});
