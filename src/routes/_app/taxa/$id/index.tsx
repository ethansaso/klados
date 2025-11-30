import {
  Box,
  Button,
  Callout,
  DataList,
  Flex,
  Heading,
  Link as RadixLink,
  Text,
} from "@radix-ui/themes";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo } from "react";
import z from "zod";
import { Breadcrumb, Breadcrumbs } from "../../../../components/-Breadcrumbs";
import { ExGbif } from "../../../../components/icons/ExGbif";
import { ExInat } from "../../../../components/icons/ExInat";
import { taxonQueryOptions } from "../../../../lib/queries/taxa";
import { taxonCharacterStatesQueryOptions } from "../../../../lib/queries/taxonCharacterStates";
import { capitalizeWord } from "../../../../lib/utils/casing";
import { NamesDataList } from "./-NameDataList";
import { TaxonCharacterSection } from "./-characters/TaxonCharacterSection";

const IMG_SIZE = 256;
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

  const breadcrumbItems: Breadcrumb[] = useMemo(() => {
    const items: Breadcrumb[] = taxon.ancestors.map((ancestor) => ({
      label: `${capitalizeWord(ancestor.rank)} ${ancestor.acceptedName}`,
      to: "/taxa/$id",
      params: { id: String(ancestor.id) },
    }));
    items.push({ label: taxon.acceptedName });
    return items;
  }, [taxon.ancestors, taxon.acceptedName]);

  // taxon.media
  // taxon.notes
  // taxon.activeChildCount
  // taxon.sourceGbifId
  // taxon.sourceInatId

  return (
    <div style={{ width: "100%" }}>
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

      <Flex gap="4">
        {/** TODO: image size accessibility */}
        <img
          src={primaryMedia?.url ?? "/logos/LogoDotted.svg"}
          style={{
            width: IMG_SIZE,
            aspectRatio: "1/1",
            objectPosition: "center",
            objectFit: "cover",
            borderRadius: "var(--radius-3)",
            overflow: "hidden",
          }}
        />
        <Box>
          <Breadcrumbs items={breadcrumbItems} size="2" />
          <Heading>
            <Text>{taxon.acceptedName} </Text>
            <Text size="3" weight="regular" color="gray">
              ({taxon.preferredCommonName})
            </Text>
          </Heading>
          <DataList.Root mt="2" size="2">
            <DataList.Item>
              <DataList.Label minWidth="88px">Rank</DataList.Label>
              <DataList.Value>{taxon.rank}</DataList.Value>
            </DataList.Item>
            <DataList.Item>
              <DataList.Label minWidth="88px">Subtaxa (44)</DataList.Label>
              <DataList.Value>
                {taxon.subtaxa.map((st) => st.acceptedName).join(", ")}
              </DataList.Value>
            </DataList.Item>
            <DataList.Item>
              <DataList.Label minWidth="88px">Notes</DataList.Label>
              <DataList.Value>{taxon.notes}</DataList.Value>
            </DataList.Item>
          </DataList.Root>
          <Flex gap="1">
            <Button type="button" size="1" mt="2" asChild>
              <RadixLink
                href={`https://www.inaturalist.org/taxa/${taxon.sourceInatId}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ textDecoration: "none" }}
                color="grass"
              >
                <ExInat size={12} />
                iNaturalist
              </RadixLink>
            </Button>
            <Button type="button" size="1" mt="2" asChild>
              <RadixLink
                href={`https://www.gbif.org/species/${taxon.sourceGbifId}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ textDecoration: "none" }}
                color="green"
              >
                <ExGbif size={18} style={{ margin: "0 -2px" }} />
                GBIF
              </RadixLink>
            </Button>
          </Flex>
        </Box>
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
