import { createServerFileRoute } from "@tanstack/react-start/server";
import { getTaxon } from "../../../db/queries/taxa";

export const ServerRoute = createServerFileRoute("/api/taxa/$id").methods({
  GET: async ({ params }) => {
    const id = Number(params.id);
    if (!Number.isFinite(id)) {
      return Response.json({ error: "Invalid id" }, { status: 400 });
    }

    const row = await getTaxon(id);
    if (!row) return Response.json({ error: "Not found" }, { status: 404 });

    // Small cache helps when people refresh quickly; tune as you like.
    return Response.json(row, {
      status: 200,
      headers: { "Cache-Control": "max-age=30, public" },
    });
  },
});
