import { createFileRoute } from "@tanstack/react-router";
import { TaxonSearchSchema } from "../../../lib/domain/taxa/search";
import { listTaxa } from "../../../lib/domain/taxa/service";
import { getQueryParams } from "../../../lib/utils/getQueryParams";

export const Route = createFileRoute("/api/_unauthenticated/taxa")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const parsed = TaxonSearchSchema.safeParse(getQueryParams(request));
        if (!parsed.success) {
          return Response.json(
            { issues: parsed.error.issues },
            { status: 400 },
          );
        }

        return Response.json(await listTaxa(parsed.data));
      },
    },
  },
});
