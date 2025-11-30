import { Button, Callout, Flex, Heading } from "@radix-ui/themes";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import z from "zod";
import { taxonQueryOptions } from "../../../../lib/queries/taxa";
import { taxonCharacterStatesQueryOptions } from "../../../../lib/queries/taxonCharacterStates";
import { NamesDataList } from "./-NameDataList";
import { TaxonCharacterSection } from "./-characters/TaxonCharacterSection";

const IMG_SIZE = 128;
const ParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const Route = createFileRoute("/_app/taxa/$id/")({
  loader: async ({ context, params }) => {
    const { id } = ParamsSchema.parse(params);
    await context.queryClient.ensureQueryData(taxonQueryOptions(id));
    await context.queryClient.ensureQueryData(
      taxonCharacterStatesQueryOptions(id)
    );

    return { id };
  },
  component: TaxonPage,
});

function TaxonPage() {
  const { id } = Route.useLoaderData();
  const navigate = useNavigate();
  const { data: taxon } = useSuspenseQuery(taxonQueryOptions(id));
  const { data: characters } = useSuspenseQuery(
    taxonCharacterStatesQueryOptions(id)
  );
  const primaryMedia = taxon.media[0];

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
      <Heading>{taxon.acceptedName}</Heading>
      <Flex>
        {/** TODO: image size accessibility */}
        <img
          src={primaryMedia?.url ?? "/logos/LogoDotted.svg"}
          style={{
            width: IMG_SIZE,
            aspectRatio: "1/1",
            objectPosition: "center",
            objectFit: "cover",
          }}
        />
        {taxon.sourceGbifId}
        {taxon.sourceInatId}
      </Flex>
      <Button
        onClick={() =>
          navigate({ to: "/taxa/$id/edit", params: { id: String(id) } })
        }
      >
        Edit
      </Button>
      <TaxonCharacterSection characters={characters} />
      <NamesDataList names={taxon.names} />
    </div>
  );
}
