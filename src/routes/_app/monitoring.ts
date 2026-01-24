import { createFileRoute } from "@tanstack/react-router";
import { sentryIngestURL } from "../../lib/logging/sentryDSN";

type DuplexedRequestInit = RequestInit & { duplex: "half" };

export const Route = createFileRoute("/_app/monitoring")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const headers = new Headers(request.headers);
        headers.delete("host");
        headers.delete("content-length");

        const response = await fetch(sentryIngestURL, {
          method: "POST",
          headers,
          body: request.body,
          duplex: "half",
        } as DuplexedRequestInit);

        return new Response(response.body, {
          status: response.status,
          headers: response.headers,
        });
      },
    },
  },
});
