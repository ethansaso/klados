import { createFileRoute } from "@tanstack/react-router";
import { listTaxaFn } from "../../../lib/api/taxa/listTaxaFn";
import { getQueryParams } from "../../../lib/utils/getQueryParams";

export const Route = createFileRoute("/api/_unauthenticated/taxa")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const query = getQueryParams(request);

        const taxa = await listTaxaFn({ data: query });
        return Response.json(taxa);
      },
    },
  },
});
