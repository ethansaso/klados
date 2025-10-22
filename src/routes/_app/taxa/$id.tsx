import { Callout } from "@radix-ui/themes";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { taxonQueryOptions } from "../../../lib/queries/taxa";

export const Route = createFileRoute("/_app/taxa/$id")({
  loader: async ({ context, params }) => {
    const numericId = Number(params.id);
    await context.queryClient.ensureQueryData(taxonQueryOptions(numericId));

    return { id: numericId };
  },
  component: TaxonPage,
});

function TaxonPage() {
  const { id } = Route.useLoaderData();
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

      <h1>
        <small>({taxon.rank})</small>
        {taxon.sourceGbifId}
        {taxon.sourceInatId}
      </h1>
    </div>
  );
}
