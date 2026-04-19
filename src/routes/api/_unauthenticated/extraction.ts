import { createFileRoute } from "@tanstack/react-router";
import { extractStates } from "../../../lib/domain/extraction/service";

export const Route = createFileRoute("/api/_unauthenticated/extraction")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json()) as { description?: string };
        const description = body.description?.trim();

        if (!description) {
          return Response.json(
            { error: "description is required" },
            { status: 400 },
          );
        }

        const result = await extractStates(description);
        return Response.json(result);
      },
    },
  },
});
