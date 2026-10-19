import {
  Box,
  Button,
  DataList,
  Flex,
  Heading,
  Link as RadixLink,
  Text,
} from "@radix-ui/themes";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { PiPencilSimple } from "react-icons/pi";
import { CuratorOnly } from "../../../../components/CuratorOnly";
import { ExGbif } from "../../../../components/icons/individual/ExGbif";
import { ExInat } from "../../../../components/icons/individual/ExInat";
import { RouterRadixLink } from "../../../../components/RouterRadixLink";
import { TaxonName } from "../../../../components/TaxonName";
import { UserHoverCard } from "../../../../components/UserHoverCard";
import type { TaxonDetailDTO } from "../../../../lib/domain/taxa/types";
import type { TaxonCurationDTO } from "../../../../lib/domain/taxon-edits/types";
import type { UserDTO } from "../../../../lib/domain/users/types";
import { capitalizeFirstLetter } from "../../../../lib/utils/formatting/casing";
import { taxonParams } from "../../../../lib/utils/formatting/taxonUrl";
import { NamesDataList } from "./-NamesDataList";

const DATE_FORMAT = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeZone: "UTC",
});

/** Taxonomy, links, and names: under the photo on desktop, its own section on phones. */
export const TaxonDetails = ({ taxon }: { taxon: TaxonDetailDTO }) => {
  const [namesOpen, setNamesOpen] = useState(false);
  const parent = taxon.ancestors.at(-1);
  const contributors = getUniqueContributors(taxon.curation);
  const lastUpdated = taxon.curation[0]?.createdAt;

  return (
    <Box className="taxon-section taxon-page__details">
      <Box display={{ initial: "block", sm: "none" }}>
        <Heading
          size="4"
          weight="medium"
          mb="1"
          className="taxon-section__header"
        >
          Details
        </Heading>
      </Box>
      <DataList.Root
        orientation={{ initial: "horizontal", sm: "vertical" }}
        mt={{ sm: "3" }}
        size="2"
      >
        <DataList.Item>
          <DataList.Label minWidth="88px">Rank</DataList.Label>
          <DataList.Value>{capitalizeFirstLetter(taxon.rank)}</DataList.Value>
        </DataList.Item>
        {parent && (
          <DataList.Item>
            <DataList.Label minWidth="88px">Parent</DataList.Label>
            <DataList.Value>
              <RouterRadixLink to="/taxa/$id" params={taxonParams(parent)}>
                <TaxonName rank={parent.rank} name={parent.acceptedName} />
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
                      <Link to="/taxa/$id" params={taxonParams(st)}>
                        <Text as="span">
                          <TaxonName rank={st.rank} name={st.acceptedName} />
                        </Text>
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
            <DataList.Label minWidth="88px">External Links</DataList.Label>
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
        <DataList.Item>
          <DataList.Label minWidth="88px">Contributors</DataList.Label>
          <DataList.Value>
            <Flex wrap="wrap" gap="1">
              {contributors.map((user, i, arr) => (
                <Flex
                  key={user?.id ?? "deleted"}
                  display="inline-flex"
                  align="center"
                >
                  {user ? (
                    <UserHoverCard
                      username={user.username}
                      name={user.name}
                      imageUrl={user.image ?? undefined}
                      description={user.description}
                      role={user.role}
                      banned={user.banned}
                    />
                  ) : (
                    <Text color="gray">[deleted]</Text>
                  )}
                  {i !== arr.length - 1 && <Text as="span">,</Text>}
                </Flex>
              ))}
            </Flex>
          </DataList.Value>
        </DataList.Item>
        <DataList.Item>
          <DataList.Label minWidth="88px">Last updated</DataList.Label>
          <DataList.Value>
            {lastUpdated && DATE_FORMAT.format(new Date(lastUpdated))}
          </DataList.Value>
        </DataList.Item>
        <DataList.Item>
          <DataList.Label minWidth="88px">Names</DataList.Label>
          <DataList.Value>
            <RadixLink asChild>
              <button
                type="button"
                aria-expanded={namesOpen}
                aria-controls="taxon-names"
                onClick={() => setNamesOpen((open) => !open)}
              >
                {namesOpen ? "[hide]" : "[show]"}
              </button>
            </RadixLink>
          </DataList.Value>
        </DataList.Item>
      </DataList.Root>
      {namesOpen && (
        <Box id="taxon-names" mt="3">
          <NamesDataList rank={taxon.rank} names={taxon.names} />
        </Box>
      )}
      <CuratorOnly>
        <Box asChild width="100%" mt="4">
          <Button asChild size="2" variant="surface">
            <Link to="/taxa/$id/edit" params={taxonParams(taxon)}>
              <PiPencilSimple />
              Edit
            </Link>
          </Button>
        </Box>
      </CuratorOnly>
    </Box>
  );
};

/**
 * Users who created or edited the taxon, in order of first contribution.
 * Deleted accounts can't be told apart, so they share one tombstone.
 */
function getUniqueContributors(
  curation: TaxonCurationDTO[],
): (UserDTO | null)[] {
  const byId = new Map<string, UserDTO | null>();
  for (const entry of [...curation].reverse()) {
    if (entry.kind !== "created" && entry.kind !== "edited") continue;
    const key = entry.user?.id ?? "deleted";
    if (!byId.has(key)) byId.set(key, entry.user);
  }
  return [...byId.values()];
}
