import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import z from "zod";
import { keyQueryOptions } from "../../../../lib/queries/keys";

const ParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const Route = createFileRoute("/_app/keys/$id/")({
  params: ParamsSchema,
  loader: async ({ context, params }) => {
    const { id } = params;

    await context.queryClient.ensureQueryData(keyQueryOptions(id));

    return { id };
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { id } = Route.useLoaderData() as { id: number };
  const { data: key } = useSuspenseQuery(keyQueryOptions(id));

  return (
    <div>
      <h1>{key.name}</h1>
      <p>{key.description}</p>
    </div>
  );
}
