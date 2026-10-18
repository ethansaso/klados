import "../../../../assets/styles/pages/taxa/$id.css";
import "./index.css";

import { Box, Button, Card, Flex, Heading, Text } from "@radix-ui/themes";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PiListDashes, PiTextAlignLeft } from "react-icons/pi";
import z from "zod";
import {
  type Breadcrumb,
  Breadcrumbs,
} from "../../../../components/Breadcrumbs";
import { ContentContainer } from "../../../../components/ContentContainer";
import { TaxonName } from "../../../../components/TaxonName";
import { supportsLookalikes } from "../../../../lib/domain/lookalikes/util";
import { distributionTilesQueryOptions } from "../../../../lib/queries/distributionTiles";
import { lookalikesQueryOptions } from "../../../../lib/queries/lookalikes";
import { taxonQueryOptions } from "../../../../lib/queries/taxa";
import { taxonCharacterStatesQueryOptions } from "../../../../lib/queries/taxonCharacterStates";
import { sourcesForTaxonQueryOptions } from "../../../../lib/queries/taxonSources";
import { formatPublicationUsage } from "../../../../lib/utils/formatting/formatPublication";
import { formatTaxonName } from "../../../../lib/utils/formatting/formatTaxonName";
import { routeSeo } from "../../../../lib/utils/head/routeSeo";
import { LookalikesList } from "./-lookalikes/LookalikesList";
import { TaxonStateSection } from "./-states/TaxonStatesSection";
import { StatusCallout } from "./-StatusCallout";
import { TaxonDetails } from "./-TaxonDetails";
import { TaxonGBIFDistribution } from "./-TaxonGBIFDistribution";
import { TaxonImageBrowser } from "./-TaxonImageBrowser";

const ParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const Route = createFileRoute("/_app/taxa/$id/")({
  params: ParamsSchema,
  loader: async ({ context, params: { id } }) => {
    const [taxon] = await Promise.all([
      context.queryClient.ensureQueryData(taxonQueryOptions(id)),
      context.queryClient.ensureQueryData(taxonCharacterStatesQueryOptions(id)),
      context.queryClient.ensureQueryData(lookalikesQueryOptions(id)),
      context.queryClient.ensureQueryData(sourcesForTaxonQueryOptions(id)),
      context.queryClient.ensureQueryData(distributionTilesQueryOptions(id)),
    ]);

    return { id, taxon };
  },
  head: ({ loaderData, match }) =>
    routeSeo({
      title: loaderData
        ? `${formatTaxonName(loaderData.taxon.rank, loaderData.taxon.acceptedName)} | Klados`
        : "Klados",
      canonicalUrl: match.pathname,
    }),
  component: TaxonPage,
});

function TaxonPage() {
  const { id } = Route.useLoaderData();
  const { data: taxon } = useSuspenseQuery(taxonQueryOptions(id));
  const { data: characterStates } = useSuspenseQuery(
    taxonCharacterStatesQueryOptions(id),
  );
  const { data: sources } = useSuspenseQuery(sourcesForTaxonQueryOptions(id));
  const { data: densityUrls } = useSuspenseQuery(
    distributionTilesQueryOptions(id),
  );

  const [indentDescription, setIndentDescription] = useState(false);

  const breadcrumbItems: Breadcrumb[] = useMemo(() => {
    const lineageItems: Breadcrumb[] = taxon.ancestors.map((ancestor) => ({
      key: String(ancestor.id),
      label: <TaxonName rank={ancestor.rank} name={ancestor.acceptedName} />,
      to: "/taxa/$id",
      params: { id: String(ancestor.id) },
    }));

    lineageItems.push({
      key: String(taxon.id),
      label: <TaxonName rank={taxon.rank} name={taxon.acceptedName} />,
    });

    if (lineageItems.length <= 4) {
      return lineageItems;
    }

    const rootItem = lineageItems[0]!;
    const parentItem = lineageItems[lineageItems.length - 2]!;
    const currentItem = lineageItems[lineageItems.length - 1]!;

    return [
      rootItem,
      {
        key: "hidden",
        label: "...",
        hiddenItems: lineageItems.slice(1, -2),
      },
      parentItem,
      currentItem,
    ];
  }, [taxon.ancestors, taxon.acceptedName, taxon.rank]);

  const taxonName = formatTaxonName(taxon.rank, taxon.acceptedName);

  return (
    <ContentContainer align="stretch">
      <div className="taxon-page">
        <Box className="taxon-page__status">
          <StatusCallout status={taxon.status} />
        </Box>
        <Box className="taxon-page__crumbs">
          <Breadcrumbs
            items={breadcrumbItems}
            size={{ initial: "1", sm: "2" }}
          />
        </Box>
        <Flex
          display={{ initial: "none", sm: "flex" }}
          align="baseline"
          wrap="wrap"
          gapX="2"
          gapY="0"
          mb="5"
        >
          <Heading size="7" weight="medium">
            <TaxonName rank={taxon.rank} name={taxon.acceptedName} />
          </Heading>
          {taxon.preferredCommonName && (
            <Text size="3" weight="regular" color="gray">
              ({taxon.preferredCommonName})
            </Text>
          )}
        </Flex>

        <Flex
          className="taxon-page__body"
          gap="8"
          direction="row"
          align="start"
        >
          {/* Left panel */}
          <Box
            className="taxon-page__sidebar"
            width="304px"
            flexShrink="0"
            asChild
          >
            <Card>
              <TaxonImageBrowser key={taxon.id} taxon={taxon} />
              <TaxonDetails taxon={taxon} />
            </Card>
          </Box>

          {/* Right panel */}
          <Flex
            className="taxon-page__main"
            direction="column"
            flexGrow="1"
            minWidth="0"
            gap="6"
          >
            {/* Morphology */}
            <Box className="taxon-section">
              <Flex
                align="end"
                justify="between"
                className="taxon-section__header"
              >
                <Heading size="4" mb="1" weight="medium">
                  Morphological Description
                </Heading>
                <Button
                  variant="ghost"
                  size="1"
                  onClick={() => setIndentDescription((p) => !p)}
                  style={{ margin: "0 0 var(--space-1) 0" }}
                >
                  {indentDescription ? (
                    <>
                      <PiListDashes />
                      List view
                    </>
                  ) : (
                    <>
                      <PiTextAlignLeft />
                      Prose view
                    </>
                  )}
                </Button>
              </Flex>

              {characterStates.length ? (
                <Text as="p" color="gray" size="1" mb="3">
                  Hover or tap underlined terms for additional information.
                </Text>
              ) : (
                <Text size={{ initial: "2", sm: "3" }}>
                  No morphological data available for this taxon.
                </Text>
              )}
              <Text as="div" size={{ initial: "2", sm: "3" }}>
                <TaxonStateSection
                  groups={characterStates}
                  sources={sources}
                  indentDescription={indentDescription}
                />
              </Text>
            </Box>

            {/* Ecology */}
            <Box className="taxon-section">
              <Heading
                size="4"
                mb="1"
                weight="medium"
                className="taxon-section__header"
              >
                Ecology
              </Heading>
              <Text as="p" size={{ initial: "2", sm: "3" }}>
                {taxon.ecology || "No ecology recorded."}
              </Text>
            </Box>

            {/* Lookalikes */}
            {/* Keyed so the scroller remounts at the start in the same commit as
                new data; the router's scroll reset lands a frame later. */}
            {supportsLookalikes(taxon.rank) && (
              <LookalikesList
                key={id}
                taxonId={id}
                taxonRank={taxon.rank}
                taxonName={taxon.acceptedName}
              />
            )}

            {/* Distribution */}
            <Box className="taxon-section">
              <Heading
                size="4"
                mb="1"
                weight="medium"
                className="taxon-section__header"
              >
                Distribution
              </Heading>
              {densityUrls && taxon.sourceGbifId !== null ? (
                <TaxonGBIFDistribution
                  densityUrls={densityUrls}
                  gbifId={taxon.sourceGbifId}
                  taxonName={taxonName}
                />
              ) : (
                <Text size={{ initial: "2", sm: "3" }}>
                  This taxon is not linked to GBIF.
                </Text>
              )}
            </Box>

            {/* Sources */}
            <Box className="taxon-section taxon-page__sources">
              <Heading
                size="4"
                mb="1"
                weight="medium"
                className="taxon-section__header"
              >
                Sources
              </Heading>
              {sources.length > 0 ? (
                <ol className="taxon-sources-list">
                  {sources.map((s) => (
                    <li key={s.id} id={`source-${s.sourceId}`}>
                      <Text as="span">{formatPublicationUsage(s)}</Text>
                    </li>
                  ))}
                </ol>
              ) : (
                <Text size={{ initial: "2", sm: "3" }}>
                  No sources available.
                </Text>
              )}
            </Box>
          </Flex>
        </Flex>
      </div>
    </ContentContainer>
  );
}
