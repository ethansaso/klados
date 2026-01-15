import { Box, Callout, Flex, Heading, Tabs, Text } from "@radix-ui/themes";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo } from "react";
import z from "zod";
import { Breadcrumb, Breadcrumbs } from "../../../../components/Breadcrumbs";
import { ContentContainer } from "../../../../components/ContentContainer";
import { lookalikesQueryOptions } from "../../../../lib/queries/lookalikes";
import { taxonQueryOptions } from "../../../../lib/queries/taxa";
import { taxonCharacterDisplayGroupsQueryOptions } from "../../../../lib/queries/taxonCharacterStates";
import { sourceForTaxonQueryOptions } from "../../../../lib/queries/taxonSources";
import { formatPublicationForTaxon } from "../../../../lib/utils/formatPublication";
import { routeSeo } from "../../../../lib/utils/head/routeSeo";
import { prefixWithRank } from "../../../../lib/utils/prefixWithRank";
import { TaxonCharacterSection } from "./-characters/TaxonCharacterSection";
import { LookalikesList } from "./-lookalikes/LookalikesList";
import { NamesDataList } from "./-NameDataList";
import { TaxonMainSection } from "./-TaxonMainSection";

const ParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const Route = createFileRoute("/_app/taxa/$id/")({
  loader: async ({ context, params }) => {
    const { id } = ParamsSchema.parse(params);

    const [taxon] = await Promise.all([
      context.queryClient.ensureQueryData(taxonQueryOptions(id)),
      context.queryClient.ensureQueryData(
        taxonCharacterDisplayGroupsQueryOptions(id)
      ),
      context.queryClient.ensureQueryData(lookalikesQueryOptions(id)),
      context.queryClient.ensureQueryData(sourceForTaxonQueryOptions(id)),
    ]);

    return { id, taxon };
  },
  head: ({ loaderData }) =>
    routeSeo({
      title: loaderData
        ? `${loaderData.taxon.acceptedName} | Klados`
        : "Klados",
    }),
  component: TaxonPage,
});

function TaxonPage() {
  const { id } = Route.useLoaderData();
  const navigate = useNavigate();
  const { data: taxon } = useSuspenseQuery(taxonQueryOptions(id));
  const { data: displayGroups } = useSuspenseQuery(
    taxonCharacterDisplayGroupsQueryOptions(id)
  );
  const { data: lookalikes } = useSuspenseQuery(lookalikesQueryOptions(id));
  const { data: sources } = useSuspenseQuery(sourceForTaxonQueryOptions(id));

  const breadcrumbItems: Breadcrumb[] = useMemo(() => {
    const items: Breadcrumb[] = taxon.ancestors.map((ancestor) => ({
      label: prefixWithRank(ancestor.rank, ancestor.acceptedName),
      to: "/taxa/$id",
      params: { id: String(ancestor.id) },
    }));
    items.push({ label: prefixWithRank(taxon.rank, taxon.acceptedName) });
    return items;
  }, [taxon.ancestors, taxon.acceptedName, taxon.rank]);

  return (
    <ContentContainer align="start">
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

      <Box mb="4">
        <Breadcrumbs items={breadcrumbItems} size="2" />
        <Flex align="baseline" wrap="wrap" gapX="2" gapY="0">
          <Heading size="7">{taxon.acceptedName}</Heading>
          {taxon.preferredCommonName && (
            <Text size="3" weight="regular" color="gray">
              ({taxon.preferredCommonName})
            </Text>
          )}
        </Flex>
      </Box>
      <Box width="100%">
        <Box mb="4">
          <TaxonMainSection taxon={taxon} navigate={navigate} />
        </Box>
        <Tabs.Root mb="4" defaultValue="states">
          <Tabs.List size={{ initial: "1", xs: "2" }} mb="5">
            <Tabs.Trigger value="states">Description</Tabs.Trigger>
            <Tabs.Trigger value="lookalikes">Lookalikes</Tabs.Trigger>
            <Tabs.Trigger value="names">Names</Tabs.Trigger>
            <Tabs.Trigger value="sources">Sources</Tabs.Trigger>
          </Tabs.List>
          <Tabs.Content value="states" mt="4">
            <TaxonCharacterSection groups={displayGroups} />
          </Tabs.Content>
          <Tabs.Content value="lookalikes" mt="4">
            <LookalikesList
              taxonId={id}
              taxonAcceptedName={taxon.acceptedName}
              lookalikes={lookalikes}
            />
          </Tabs.Content>
          <Tabs.Content value="names" mt="4">
            <Heading size="4" mb="2">
              Names
            </Heading>
            <NamesDataList names={taxon.names} />
          </Tabs.Content>
          <Tabs.Content value="sources" mt="4">
            <Heading size="4">Sources</Heading>
            {sources.length > 0 ? (
              sources.map((s) => (
                <Text key={s.id} mb="2">
                  {formatPublicationForTaxon(s)}
                </Text>
              ))
            ) : (
              <Text color="gray">No sources available.</Text>
            )}
          </Tabs.Content>
        </Tabs.Root>
      </Box>
    </ContentContainer>
  );
}
