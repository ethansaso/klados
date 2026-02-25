import { createFileRoute, Outlet } from "@tanstack/react-router";
import z from "zod";
import { characterQueryOptions } from "../../../../../lib/queries/characters";

const ParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const Route = createFileRoute("/_app/glossary/characters/$id")({
  head: () => ({
    meta: [{ name: "robots", content: "noindex,follow" }],
  }),
  params: ParamsSchema,
  loader: async ({ context, params }) => {
    await context.queryClient.ensureQueryData(characterQueryOptions(params.id));
    return { id: params.id };
  },
  component: Outlet,
});
