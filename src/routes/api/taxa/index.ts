// import { createFileRoute } from "@tanstack/react-router";
// import { json } from "@tanstack/react-start";
// import { searchTaxa } from "../../../db/queries/taxa";
// import { createCacheHeader } from "../../../lib/utils/http";
// import { clampInt } from "../../../lib/utils/number";
// import { getRequest } from "@tanstack/react-start/server";

// export const Route = createFileRoute("/api/taxa/")({
//   server: {
//     handlers: {
//       // GET /api/taxa?q=<term>&limit=<n>&offset=<n>
//       GET: async ({ request }) => {
//         const url = new URL(request.url);
//         const q = url.searchParams.get("q")?.trim() || undefined;
//         const limit = clampInt(url.searchParams.get("limit"), 1, 100, 50);
//         const offset = clampInt(url.searchParams.get("offset"), 0, 10_000, 0);

//         const items = await searchTaxa(q, limit, offset); // if q is undefined, returns alpha list

//         return json(
//           { items, count: items.length },
//           { headers: createCacheHeader(q ? 15 : 60) }
//         );
//       },
//     },
//   },
// });
