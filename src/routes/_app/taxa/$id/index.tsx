import "../../../../assets/styles/pages/taxa/$id.css";

import { Box, Card, Flex, Heading, Text } from "@radix-ui/themes";
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
import { LookalikesList } from "./-lookalikes/LookalikesList";
import { TaxonStateSection } from "./-states/TaxonStatesSection";
import { StatusCallout } from "./-StatusCallout";
import { TaxonMainSection } from "./-TaxonMainSection";

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
      <Box mb="5">
        <Breadcrumbs items={breadcrumbItems} size={{ initial: "1", xs: "2" }} />
        <Flex
          align="baseline"
          wrap="wrap"
          gapX="2"
          gapY="0"
          mt={{ initial: "1", xs: "0" }}
        >
          <Heading size={{ initial: "4", xs: "7" }} weight="medium">
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

      <Flex gap="8" direction={{ initial: "column", sm: "row" }}>
        {/* Left panel */}
        <Box width={{ initial: "unset", sm: "304px" }} flexShrink="0" asChild>
          <Card>
            <TaxonMainSection taxon={taxon} navigate={navigate} />
          </Card>
        </Box>

        {/* Right panel */}
        <Flex direction="column" flexGrow="1" gap="5">
          {/* Morphology */}
          <Box>
            <Box>
              <Heading
                size={{ initial: "3", sm: "4" }}
                mb="1"
                weight="medium"
                style={{ borderBottom: "1px solid var(--gray-a7)" }}
              >
                Morphological Description
              </Heading>
              {characterStates.length ? (
                <Text as="p" color="gray" size="1" mb="3">
                  Some traits may have additional information from the glossary,
                  indicated by an underline. Hover over these terms to view
                  these definitions.
                </Text>
              ) : (
                <Text size={{ initial: "2", sm: "3" }}>
                  No morphological data available for this taxon.
                </Text>
              )}
            </Box>
            <TaxonStateSection groups={characterStates} />
          </Box>

          {/* Ecology */}
          <Box>
            <Heading
              size={{ initial: "3", sm: "4" }}
              mb="1"
              weight="medium"
              style={{ borderBottom: "1px solid var(--gray-a7)" }}
            >
              Ecology
            </Heading>
            {taxon.ecology ? (
              <Text>{taxon.ecology}</Text>
            ) : (
              <Text>No ecology recorded.</Text>
            )}
          </Box>

          {/* Lookalikes */}
          <Box>
            <Heading
              size={{ initial: "3", sm: "4" }}
              mb="1"
              weight="medium"
              style={{ borderBottom: "1px solid var(--gray-a7)" }}
            >
              Similar Taxa
            </Heading>
            {lookalikes.length ? (
              <Text as="p" color="gray" size="1" mb="3">
                These taxa share similar characteristics with{" "}
                {taxon.acceptedName}. Click on any taxon to compare
                side-by-side.
              </Text>
            ) : (
              <Text size={{ initial: "2", sm: "3" }}>
                We couldn't determine any lookalikes for this taxon.
              </Text>
            )}
            <LookalikesList taxonId={id} lookalikes={lookalikes} />
          </Box>

          {/* Sources */}
          <Box>
            <Heading
              size={{ initial: "3", sm: "4" }}
              mb="1"
              weight="medium"
              style={{ borderBottom: "1px solid var(--gray-a7)" }}
            >
              Sources
            </Heading>
            {sources.length > 0 ? (
              sources.map((s) => (
                <Text key={s.id} mb="2">
                  {formatPublicationForTaxon(s)}
                </Text>
              ))
            ) : (
              <Text>No sources available.</Text>
            )}
          </Box>
        </Flex>
      </Flex>
    </ContentContainer>
  );
}
