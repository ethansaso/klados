// import { createFileRoute } from "@tanstack/react-router";
// import { json } from "@tanstack/react-start";
// import { getTaxon } from "../../../db/queries/taxa";

// export const Route = createFileRoute("/api/taxa/$id")({
//   server: {
//     handlers: {
//       GET: async ({ params }) => {
//         const id = Number(params.id);
//         if (!Number.isFinite(id)) {
//           return json({ error: "Invalid id" }, { status: 400 });
//         }

//         const row = await getTaxon(id);
//         if (!row) {
//           return json({ error: "Not found" }, { status: 404 });
//         }

//         // Small cache helps when users refresh quickly
//         return json(row, {
//           status: 200,
//           headers: { "Cache-Control": "max-age=30, public" },
//         });
//       },
//     },
//   },
// });
