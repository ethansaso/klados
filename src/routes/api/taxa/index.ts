import { createServerFileRoute } from "@tanstack/react-start/server";
import { searchTaxa } from "../../../db/queries/taxa";
import { createCacheHeader } from "../../../lib/http";
import { clampInt } from "../../../lib/number";

export const ServerRoute = createServerFileRoute("/api/taxa/").methods({
  // GET /api/taxa?q=<term>&limit=<n>
  GET: async ({ request }) => {
    const url = new URL(request.url);
    const q = url.searchParams.get("q")?.trim() || undefined;
    const limit = clampInt(url.searchParams.get("limit"), 1, 100, 50);
    const offset = clampInt(url.searchParams.get("offset"), 0, 10_000, 0);

    const items = await searchTaxa(q, limit, offset); // when q is undefined, returns alpha list
    return Response.json(
      { items, count: items.length },
      { headers: createCacheHeader(q ? 15 : 60) }
    );
  },
});
