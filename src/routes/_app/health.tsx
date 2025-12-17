import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/health")({
  server: {
    handlers: {
      GET: async () => {
        return new Response("OK", { status: 200 });
      },
    },
  },
});
