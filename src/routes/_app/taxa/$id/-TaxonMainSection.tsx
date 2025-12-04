import {
  Box,
  Button,
  DataList,
  Flex,
  Link as RadixLink,
  Text,
} from "@radix-ui/themes";
import { Link, UseNavigateResult } from "@tanstack/react-router";
import { PiPencilSimple } from "react-icons/pi";
import { ExGbif } from "../../../../components/icons/ExGbif";
import { ExInat } from "../../../../components/icons/ExInat";
import { useMe } from "../../../../lib/auth/useMe";
import { roleHasCuratorRights } from "../../../../lib/auth/utils";
import { TaxonDetailDTO } from "../../../../lib/domain/taxa/types";
import { TaxonImageBrowser } from "./-TaxonImageBrowser";

export const TaxonMainSection = ({
  taxon,
  navigate,
}: {
  taxon: TaxonDetailDTO;
  navigate: UseNavigateResult<"string">;
}) => {
  const { data: me } = useMe();

  return (
    <Flex gap="4">
      <TaxonImageBrowser media={taxon.media} key={taxon.id} />
      <Flex direction="column" justify="between">
        <Box>
          <DataList.Root mt="2" size="2">
            <DataList.Item>
              <DataList.Label minWidth="88px">Rank</DataList.Label>
              <DataList.Value>{taxon.rank}</DataList.Value>
            </DataList.Item>
            {taxon.subtaxa.length > 0 && (
              <DataList.Item>
                <DataList.Label minWidth="88px">
                  Subtaxa ({taxon.activeChildCount})
                </DataList.Label>
                <DataList.Value>
                  <Flex wrap="wrap" gap="1">
                    {taxon.subtaxa.map((st, i, arr) => (
                      <Flex key={st.id} display="inline-flex" align="center">
                        <RadixLink asChild>
                          <Link to="/taxa/$id" params={{ id: String(st.id) }}>
                            <Text as="span">{st.acceptedName}</Text>
                          </Link>
                        </RadixLink>
                        {i !== arr.length - 1 && <Text as="span">,</Text>}
                      </Flex>
                    ))}
                  </Flex>
                </DataList.Value>
              </DataList.Item>
            )}
            {taxon.notes && (
              <DataList.Item>
                <DataList.Label minWidth="88px">Notes</DataList.Label>
                <DataList.Value>{taxon.notes}</DataList.Value>
              </DataList.Item>
            )}
          </DataList.Root>
        </Box>
        <Flex gap="1" mt="2">
          {roleHasCuratorRights(me?.role) && (
            <Button
              type="button"
              size="2"
              onClick={() =>
                navigate({
                  to: "/taxa/$id/edit",
                  params: { id: String(taxon.id) },
                })
              }
            >
              <PiPencilSimple size={12} />
              Edit
            </Button>
          )}
          <Button type="button" size="2" asChild>
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
          <Button type="button" size="2" asChild>
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
      </Flex>
    </Flex>
  );
};
