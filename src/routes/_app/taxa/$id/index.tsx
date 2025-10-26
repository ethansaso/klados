import { Button, Callout } from "@radix-ui/themes";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { taxonQueryOptions } from "../../../../lib/queries/taxa";

export const Route = createFileRoute("/_app/taxa/$id/")({
  loader: async ({ context, params }) => {
    const numericId = Number(params.id);
    await context.queryClient.ensureQueryData(taxonQueryOptions(numericId));

    return { id: numericId };
  },
  component: TaxonPage,
});

// TODO: figure out whether to preload in Route and/or useSuspenseQuery
function TaxonPage() {
  const { id } = Route.useLoaderData();
  const navigate = useNavigate();
  const { data: taxon } = useSuspenseQuery(taxonQueryOptions(id));

  return (
    <div>
      {taxon.status !== "active" && (
        <Callout.Root
          color={taxon.status === "deprecated" ? "tomato" : undefined}
        >
          <Callout.Text>
            Heads up! This taxon is{" "}
            {taxon.status === "draft"
              ? "currently under review."
              : "not active."}
          </Callout.Text>
        </Callout.Root>
      )}

      <small>({taxon.rank})</small>
      <h1>{taxon.acceptedName}</h1>
      {taxon.sourceGbifId}
      {taxon.sourceInatId}
      <Button
        onClick={() =>
          navigate({ to: "/taxa/$id/edit", params: { id: String(id) } })
        }
      >
        Edit
      </Button>
    </div>
  );
}
