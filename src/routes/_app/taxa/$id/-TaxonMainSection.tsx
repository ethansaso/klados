import {
  Box,
  Button,
  DataList,
  Flex,
  Link as RadixLink,
  Text,
} from "@radix-ui/themes";
import { Link, type UseNavigateResult } from "@tanstack/react-router";
import { Accordion } from "radix-ui";
import { useState } from "react";
import {
  PiCaretDown,
  PiCaretUp,
  PiPencilSimple,
  PiTreeStructureFill,
} from "react-icons/pi";
import { CuratorOnly } from "../../../../components/CuratorOnly";
import { ExGbif } from "../../../../components/icons/individual/ExGbif";
import { ExInat } from "../../../../components/icons/individual/ExInat";
import { ResponsiveTooltip } from "../../../../components/ResponsiveTooltip";
import { RouterRadixLink } from "../../../../components/RouterRadixLink";
import type { TaxonDetailDTO } from "../../../../lib/domain/taxa/types";
import { NamesDataList } from "./-NamesDataList";
import { TaxonImageBrowser } from "./-TaxonImageBrowser";

export const TaxonMainSection = ({
  taxon,
  navigate,
}: {
  taxon: TaxonDetailDTO;
  navigate: UseNavigateResult<"string">;
}) => {
  const [openSections, setOpenSections] = useState<string[]>([]);

  return (
    <Flex direction="column" gap={{ xs: "3" }}>
      <TaxonImageBrowser
        taxonName={taxon.acceptedName}
        media={taxon.media}
        key={taxon.id}
      />
      <Flex gap="2">
        <CuratorOnly>
          <Button
            type="button"
            size={{ initial: "1", sm: "2" }}
            variant="soft"
            onClick={() =>
              navigate({
                to: "/taxa/$id/edit",
                params: { id: String(taxon.id) },
              })
            }
            style={{ flex: 1 }}
          >
            <PiPencilSimple size={12} />
            Edit
          </Button>
        </CuratorOnly>
        {taxon.activeChildCount > 0 ? (
          <Button
            type="button"
            disabled={taxon.activeChildCount === 0}
            size={{ initial: "1", sm: "2" }}
            onClick={() =>
              navigate({
                to: "/guides/create",
                search: { initialId: taxon.id },
              })
            }
            style={{ flex: 1 }}
          >
            <PiTreeStructureFill size={12} />
            Create Guide
          </Button>
        ) : (
          <ResponsiveTooltip content="This taxon has no subtaxa.">
            <Button
              type="button"
              disabled
              size={{ initial: "1", sm: "2" }}
              onClick={() =>
                navigate({
                  to: "/guides/create",
                  search: { initialId: taxon.id },
                })
              }
              style={{ flex: 1 }}
            >
              <PiTreeStructureFill size={12} />
              Create Guide
            </Button>
          </ResponsiveTooltip>
        )}
      </Flex>
      <Flex direction="column" justify="between" gap="2">
        <DataList.Root
          orientation="vertical"
          mt="3"
          size={{ initial: "1", sm: "2" }}
        >
          <DataList.Item>
            <DataList.Label minWidth="88px">Rank</DataList.Label>
            <DataList.Value>{taxon.rank}</DataList.Value>
          </DataList.Item>
          {taxon.parentId && (
            <DataList.Item>
              <DataList.Label>Parent</DataList.Label>
              <DataList.Value>
                <RouterRadixLink to="/taxa/$id" params={{ id: taxon.parentId }}>
                  {taxon.ancestors.at(-1)?.acceptedName}
                </RouterRadixLink>
              </DataList.Value>
            </DataList.Item>
          )}
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
          {(taxon.sourceInatId !== null || taxon.sourceGbifId !== null) && (
            <DataList.Item>
              <DataList.Label>External Links</DataList.Label>
              <DataList.Value>
                <Flex className="externals" direction="column" gap="1">
                  {taxon.sourceInatId !== null && (
                    <RadixLink
                      href={`https://www.inaturalist.org/taxa/${taxon.sourceInatId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      color="lime"
                    >
                      <ExInat size={14} color="green" />
                      <Text ml="1">iNaturalist</Text>
                    </RadixLink>
                  )}
                  {taxon.sourceGbifId !== null && (
                    <RadixLink
                      href={`https://www.gbif.org/species/${taxon.sourceGbifId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      color="green"
                    >
                      <ExGbif
                        size={18}
                        color="green"
                        style={{ margin: "-2px" }}
                      />
                      <Text ml="1">GBIF</Text>
                    </RadixLink>
                  )}
                </Flex>
              </DataList.Value>
            </DataList.Item>
          )}
          <Accordion.Root
            type="multiple"
            value={openSections}
            onValueChange={setOpenSections}
          >
            <Accordion.Item value="names" asChild>
              <DataList.Item style={{ cursor: "pointer" }}>
                <Accordion.Trigger asChild>
                  <DataList.Label style={{ alignItems: "center" }}>
                    Names{" "}
                    {openSections.includes("names") ? (
                      <PiCaretUp
                        style={{
                          display: "block",
                          marginLeft: "auto",
                          fontSize: "var(--font-size-1)",
                        }}
                      />
                    ) : (
                      <PiCaretDown
                        style={{
                          display: "block",
                          marginLeft: "auto",
                          fontSize: "var(--font-size-1)",
                        }}
                      />
                    )}
                  </DataList.Label>
                </Accordion.Trigger>
                <Accordion.Content>
                  <DataList.Value>
                    <Box mt="2">
                      <NamesDataList names={taxon.names} />
                    </Box>
                  </DataList.Value>
                </Accordion.Content>
              </DataList.Item>
            </Accordion.Item>
          </Accordion.Root>
        </DataList.Root>
      </Flex>
    </Flex>
  );
};
