import { Callout, Flex } from "@radix-ui/themes";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import z from "zod";
import { taxonQueryOptions } from "../../../../lib/queries/taxa";
import { taxonCharacterDisplayGroupsQueryOptions } from "../../../../lib/queries/taxonCharacterStates";
import { TaxonCharacterSection } from "./-characters/TaxonCharacterSection";
import { NamesDataList } from "./-NameDataList";
import { TaxonMainSection } from "./-TaxonMainSection";

const ParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const Route = createFileRoute("/_app/taxa/$id/")({
  loader: async ({ context, params }) => {
    const { id } = ParamsSchema.parse(params);
    await context.queryClient.ensureQueryData(taxonQueryOptions(id));
    await context.queryClient.ensureQueryData(
      taxonCharacterDisplayGroupsQueryOptions(id)
    );

    return { id };
  },
  component: TaxonPage,
});

function TaxonPage() {
  const { id } = Route.useLoaderData();
  const navigate = useNavigate();
  const { data: taxon } = useSuspenseQuery(taxonQueryOptions(id));
  const { data: displayGroups } = useSuspenseQuery(
    taxonCharacterDisplayGroupsQueryOptions(id)
  );

  // taxon.media
  // taxon.notes
  // taxon.activeChildCount
  // taxon.sourceGbifId
  // taxon.sourceInatId

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

      <Flex direction="column" gap="6">
        <TaxonMainSection taxon={taxon} navigate={navigate} />
        <TaxonCharacterSection groups={displayGroups} />
        <NamesDataList names={taxon.names} />
      </Flex>
    </div>
  );
}
