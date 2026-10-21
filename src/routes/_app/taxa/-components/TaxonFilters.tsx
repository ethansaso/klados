import "./TaxonFilters.css";

import {
  Box,
  Button,
  Card,
  Checkbox,
  Flex,
  Heading,
  Select,
  Separator,
  Text,
} from "@radix-ui/themes";
import {
  TAXON_RANKS_DESCENDING,
  TAXON_STATUSES,
  type TaxonStatus,
} from "../../../../../db/schema/schema";
import { type TaxonSearchParams } from "../../../../lib/domain/taxa/search";
import { capitalizeFirstLetter } from "../../../../lib/utils/formatting/casing";

type Props = {
  search: TaxonSearchParams;
  setSearch: (partial: Partial<TaxonSearchParams>) => void;
};

const QUALITY_FLAGS = [
  { key: "hasMorphology", label: "Has morphology" },
  { key: "hasEcology", label: "Has ecology" },
  { key: "hasMedia", label: "Has media" },
] as const satisfies readonly {
  key: keyof TaxonSearchParams;
  label: string;
}[];

const HEADER_MB = "2";

export function TaxonFilters({ search, setSearch }: Props) {
  const toggleStatus = (status: TaxonStatus, checked: boolean) => {
    const next = checked
      ? TAXON_STATUSES.filter((s) => s === status || search.status.includes(s))
      : search.status.filter((s) => s !== status);

    setSearch({ status: next });
  };

  return (
    <Box asChild width="100%">
      <Card size="2">
        <Flex gap="5" wrap="wrap">
          <Flex
            direction="column"
            gap="3"
            width={{ initial: "100%", xs: "auto" }}
          >
            <Box>
              <Heading size="2" mb={HEADER_MB}>
                Taxonomy
              </Heading>

              <Flex direction="row" gap="3">
                {/* High rank */}
                <Flex
                  direction="column"
                  gap="1"
                  flexGrow="1"
                  flexBasis="0"
                  minWidth={{ initial: "0", xs: "160px" }}
                >
                  <Flex align="center" justify="between" gap="2">
                    <Text as="label" htmlFor="high-rank" size="1" color="gray">
                      High rank
                    </Text>
                    {search.highRank && (
                      <Button
                        type="button"
                        size="1"
                        variant="ghost"
                        onClick={() => setSearch({ highRank: undefined })}
                      >
                        Clear
                      </Button>
                    )}
                  </Flex>
                  <Select.Root
                    value={search.highRank ?? ""}
                    onValueChange={(value) =>
                      setSearch({
                        highRank: value as TaxonSearchParams["highRank"],
                      })
                    }
                  >
                    <Select.Trigger placeholder="Any" id="high-rank" />
                    <Select.Content>
                      {TAXON_RANKS_DESCENDING.map((rank) => (
                        <Select.Item key={rank} value={rank}>
                          {capitalizeFirstLetter(rank)}
                        </Select.Item>
                      ))}
                    </Select.Content>
                  </Select.Root>
                </Flex>

                {/* Low rank */}
                <Flex
                  direction="column"
                  gap="1"
                  flexGrow="1"
                  flexBasis="0"
                  minWidth={{ initial: "0", xs: "160px" }}
                >
                  <Flex align="center" justify="between" gap="2">
                    <Text as="label" htmlFor="low-rank" size="1" color="gray">
                      Low rank
                    </Text>
                    {search.lowRank && (
                      <Button
                        type="button"
                        size="1"
                        variant="ghost"
                        onClick={() => setSearch({ lowRank: undefined })}
                      >
                        Clear
                      </Button>
                    )}
                  </Flex>
                  <Select.Root
                    value={search.lowRank ?? ""}
                    onValueChange={(value) =>
                      setSearch({
                        lowRank: value as TaxonSearchParams["lowRank"],
                      })
                    }
                  >
                    <Select.Trigger placeholder="Any" id="low-rank" />
                    <Select.Content>
                      {TAXON_RANKS_DESCENDING.map((rank) => (
                        <Select.Item key={rank} value={rank}>
                          {capitalizeFirstLetter(rank)}
                        </Select.Item>
                      ))}
                    </Select.Content>
                  </Select.Root>
                </Flex>
              </Flex>
            </Box>
            <Box>
              <Heading size="2" mb={HEADER_MB}>
                Status
              </Heading>
              <Flex gap="1" mb="2" style={{ minWidth: 180 }}>
                {TAXON_STATUSES.map((status) => {
                  const active = search.status.includes(status);

                  return (
                    <Button
                      key={status}
                      type="button"
                      size="1"
                      radius="full"
                      variant={active ? "solid" : "outline"}
                      aria-pressed={active}
                      onClick={() => toggleStatus(status, !active)}
                    >
                      {capitalizeFirstLetter(status)}
                    </Button>
                  );
                })}
              </Flex>
            </Box>
          </Flex>
          <Separator
            orientation="vertical"
            className="taxon-filters__separator"
          />
          <Box>
            <Heading size="2" mb={HEADER_MB}>
              Properties
            </Heading>
            <Flex direction="column" gap="1" style={{ minWidth: 180 }}>
              {QUALITY_FLAGS.map(({ key, label }) => (
                <Flex key={key} align="center" gap="2">
                  <Checkbox
                    id={key}
                    checked={!!search[key]}
                    onCheckedChange={(checked) =>
                      setSearch({
                        [key]: checked === true ? true : undefined,
                      } as Partial<TaxonSearchParams>)
                    }
                  />
                  <Text as="label" htmlFor={key} size="2">
                    {label}
                  </Text>
                </Flex>
              ))}
            </Flex>
          </Box>
        </Flex>
      </Card>
    </Box>
  );
}
