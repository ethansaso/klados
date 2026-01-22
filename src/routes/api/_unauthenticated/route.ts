import { createFileRoute } from "@tanstack/react-router";
import { corsMiddleware } from "../../../lib/utils/corsMiddleware";

export const Route = createFileRoute("/api/_unauthenticated")({
  server: {
    middleware: [corsMiddleware],
  },
});
