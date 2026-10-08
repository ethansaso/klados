import { createFileRoute } from "@tanstack/react-router";
import { corsMiddleware } from "../../../lib/utils/middleware/corsMiddleware";

export const Route = createFileRoute("/api/_unauthenticated")({
  server: {
    middleware: [corsMiddleware],
  },
});
