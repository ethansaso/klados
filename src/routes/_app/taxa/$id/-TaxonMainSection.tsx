import {
  Box,
  Button,
  DataList,
  Flex,
  Heading,
  Link as RadixLink,
  Text,
} from "@radix-ui/themes";
import { UseNavigateResult } from "@tanstack/react-router";
import { useMemo } from "react";
import { Breadcrumb, Breadcrumbs } from "../../../../components/-Breadcrumbs";
import { ExGbif } from "../../../../components/icons/ExGbif";
import { ExInat } from "../../../../components/icons/ExInat";
import { TaxonDetailDTO } from "../../../../lib/domain/taxa/types";
import { capitalizeWord } from "../../../../lib/utils/casing";
import { TaxonImageBrowser } from "./-TaxonImageBrowser";

export const TaxonMainSection = ({
  taxon,
  navigate,
}: {
  taxon: TaxonDetailDTO;
  navigate: UseNavigateResult<"string">;
}) => {
  const breadcrumbItems: Breadcrumb[] = useMemo(() => {
    const items: Breadcrumb[] = taxon.ancestors.map((ancestor) => ({
      label: `${capitalizeWord(ancestor.rank)} ${ancestor.acceptedName}`,
      to: "/taxa/$id",
      params: { id: String(ancestor.id) },
    }));
    items.push({ label: taxon.acceptedName });
    return items;
  }, [taxon.ancestors, taxon.acceptedName]);

  return (
    <Flex gap="4">
      <TaxonImageBrowser media={taxon.media} />
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
      <Button
        onClick={() =>
          navigate({ to: "/taxa/$id/edit", params: { id: String(taxon.id) } })
        }
      >
        Edit
      </Button>
    </Flex>
  );
};
