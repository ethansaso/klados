import { createFileRoute, Outlet } from "@tanstack/react-router";
import z from "zod";
import { featureQueryOptions } from "../../../../../lib/queries/features";

const ParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const Route = createFileRoute("/_app/glossary/features/$id")({
  head: () => ({
    meta: [{ name: "robots", content: "noindex,follow" }],
  }),
  params: ParamsSchema,
  loader: async ({ context, params }) => {
    await context.queryClient.ensureQueryData(featureQueryOptions(params.id));
    return params;
  },
  component: Outlet,
});
