import { Box, Callout, Flex, Heading, Text } from "@radix-ui/themes";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo } from "react";
import z from "zod";
import { Breadcrumb, Breadcrumbs } from "../../../../components/-Breadcrumbs";
import { taxonQueryOptions } from "../../../../lib/queries/taxa";
import { taxonCharacterDisplayGroupsQueryOptions } from "../../../../lib/queries/taxonCharacterStates";
import { prefixWithRank } from "../../../../lib/utils/prefixWithRank";
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

  const breadcrumbItems: Breadcrumb[] = useMemo(() => {
    const items: Breadcrumb[] = taxon.ancestors.map((ancestor) => ({
      label: prefixWithRank(ancestor.rank, ancestor.acceptedName),
      to: "/taxa/$id",
      params: { id: String(ancestor.id) },
    }));
    items.push({ label: prefixWithRank(taxon.rank, taxon.acceptedName) });
    return items;
  }, [taxon.ancestors, taxon.acceptedName]);

  return (
    <Box>
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
        <Heading>
          <Text>{taxon.acceptedName} </Text>
          <Text size="3" weight="regular" color="gray">
            ({taxon.preferredCommonName})
          </Text>
        </Heading>
      </Box>
      <Flex direction="column" gap="6">
        <TaxonMainSection taxon={taxon} navigate={navigate} />
        <TaxonCharacterSection groups={displayGroups} />
        <NamesDataList names={taxon.names} />
      </Flex>
    </Box>
  );
}
