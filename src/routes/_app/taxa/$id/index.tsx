import { Box, Flex, Heading, Tabs, Text } from "@radix-ui/themes";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo } from "react";
import z from "zod";
import {
  type Breadcrumb,
  Breadcrumbs,
} from "../../../../components/Breadcrumbs";
import { ContentContainer } from "../../../../components/ContentContainer";
import { lookalikesQueryOptions } from "../../../../lib/queries/lookalikes";
import { taxonQueryOptions } from "../../../../lib/queries/taxa";
import { taxonCharacterStatesQueryOptions } from "../../../../lib/queries/taxonCharacterStates";
import { sourcesForTaxonQueryOptions } from "../../../../lib/queries/taxonSources";
import { formatPublicationForTaxon } from "../../../../lib/utils/formatting/formatPublication";
import { prefixWithRank } from "../../../../lib/utils/formatting/prefixWithRank";
import { routeSeo } from "../../../../lib/utils/head/routeSeo";
import { TaxonCharacterSection } from "./-characters/TaxonCharacterSection";
import { LookalikesList } from "./-lookalikes/LookalikesList";
import { NamesDataList } from "./-NameDataList";
import { TaxonMainSection } from "./-TaxonMainSection";

import taxonPageCssUrl from "../../../../assets/styles/pages/taxa/$id.css?url";
import { StatusCallout } from "./-StatusCallout";

const ParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const Route = createFileRoute("/_app/taxa/$id/")({
  loader: async ({ context, params }) => {
    const { id } = ParamsSchema.parse(params);

    const [taxon] = await Promise.all([
      context.queryClient.ensureQueryData(taxonQueryOptions(id)),
      context.queryClient.ensureQueryData(taxonCharacterStatesQueryOptions(id)),
      context.queryClient.ensureQueryData(lookalikesQueryOptions(id)),
      context.queryClient.ensureQueryData(sourcesForTaxonQueryOptions(id)),
    ]);

    return { id, taxon };
  },
  head: ({ loaderData, match }) =>
    routeSeo({
      title: loaderData
        ? `${loaderData.taxon.acceptedName} | Klados`
        : "Klados",
      links: [{ rel: "stylesheet", href: taxonPageCssUrl }],
      canonicalUrl: match.pathname,
    }),
  component: TaxonPage,
});

function TaxonPage() {
  const { id } = Route.useLoaderData();
  const navigate = useNavigate();
  const { data: taxon } = useSuspenseQuery(taxonQueryOptions(id));
  const { data: characterStates } = useSuspenseQuery(
    taxonCharacterStatesQueryOptions(id),
  );
  const { data: lookalikes } = useSuspenseQuery(lookalikesQueryOptions(id));
  const { data: sources } = useSuspenseQuery(sourcesForTaxonQueryOptions(id));

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
      <StatusCallout status={taxon.status} />
      <Box mb={{ initial: "3", xs: "4" }}>
        <Breadcrumbs items={breadcrumbItems} size={{ initial: "1", xs: "2" }} />
        <Flex
          align="baseline"
          wrap="wrap"
          gapX="2"
          gapY="0"
          mt={{ initial: "1", xs: "0" }}
        >
          <Heading size={{ initial: "4", xs: "7" }}>
            {taxon.acceptedName}
          </Heading>
          {taxon.preferredCommonName && (
            <Text
              size={{ initial: "2", xs: "3" }}
              weight="regular"
              color="gray"
            >
              ({taxon.preferredCommonName})
            </Text>
          )}
        </Flex>
      </Box>
      <Box width="100%">
        <Box mb={{ initial: "2", xs: "4" }}>
          <TaxonMainSection taxon={taxon} navigate={navigate} />
        </Box>
        <Tabs.Root defaultValue="states">
          <Tabs.List
            size={{ initial: "1", xs: "2" }}
            mb={{ initial: "4", xs: "5" }}
          >
            <Tabs.Trigger value="states">Description</Tabs.Trigger>
            <Tabs.Trigger value="lookalikes">Lookalikes</Tabs.Trigger>
            <Tabs.Trigger value="names">Names</Tabs.Trigger>
            <Tabs.Trigger value="sources">Sources</Tabs.Trigger>
          </Tabs.List>
          <Tabs.Content value="states">
            <TaxonCharacterSection groups={characterStates} />
          </Tabs.Content>
          <Tabs.Content value="lookalikes">
            <LookalikesList
              taxonId={id}
              taxonAcceptedName={taxon.acceptedName}
              lookalikes={lookalikes}
            />
          </Tabs.Content>
          <Tabs.Content value="names">
            <Heading size={{ initial: "3", sm: "4" }} mb="3">
              Names
            </Heading>
            <NamesDataList names={taxon.names} />
          </Tabs.Content>
          <Tabs.Content value="sources">
            <Heading size={{ initial: "3", sm: "4" }} mb="1">
              Sources
            </Heading>
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
