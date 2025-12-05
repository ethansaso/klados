import { Button, Flex, Popover, Select, Switch, Text } from "@radix-ui/themes";
import { PiFunnelFill } from "react-icons/pi";
import { TAXON_RANKS_DESCENDING } from "../../../db/schema/schema";
import type { TaxonSearchParams } from "../../../lib/domain/taxa/search";
import { capitalizeFirstLetter } from "../../../lib/utils/casing";

type Props = {
  search: TaxonSearchParams;
  setSearch: (partial: Partial<TaxonSearchParams>) => void;
};

// TODO: fix lack of clear-select function in radix ui
export function TaxaFilterPopover({ search, setSearch }: Props) {
  return (
    <Popover.Root>
      <Popover.Trigger>
        <Button type="button" variant="soft">
          <PiFunnelFill />
          Filters
        </Button>
      </Popover.Trigger>
      <Popover.Content>
        <Flex direction="column" gap="3" style={{ minWidth: 220 }}>
          <Text size="2" weight="medium">
            Filters
          </Text>

          {/* High rank */}
          <Flex direction="column" gap="1">
            <Text size="1" color="gray">
              High rank
            </Text>
            <Select.Root
              value={search.highRank ?? ""}
              onValueChange={(value) =>
                setSearch({
                  highRank:
                    value === ""
                      ? undefined
                      : (value as TaxonSearchParams["highRank"]),
                  page: 1,
                })
              }
            >
              <Select.Trigger placeholder="Any" />
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
          <Flex direction="column" gap="1">
            <Text size="1" color="gray">
              Low rank
            </Text>
            <Select.Root
              value={search.lowRank ?? ""}
              onValueChange={(value) =>
                setSearch({
                  lowRank:
                    value === ""
                      ? undefined
                      : (value as TaxonSearchParams["lowRank"]),
                  page: 1,
                })
              }
            >
              <Select.Trigger placeholder="Any" />
              <Select.Content>
                {TAXON_RANKS_DESCENDING.map((rank) => (
                  <Select.Item key={rank} value={rank}>
                    {capitalizeFirstLetter(rank)}
                  </Select.Item>
                ))}
              </Select.Content>
            </Select.Root>
          </Flex>

          {/* Has media */}
          <Flex align="center" gap="2">
            <Switch
              checked={!!search.hasMedia}
              onCheckedChange={(checked) =>
                setSearch({
                  hasMedia: checked ? true : undefined,
                  page: 1,
                })
              }
            />
            <Text size="1">Only taxa with media</Text>
          </Flex>
        </Flex>
      </Popover.Content>
    </Popover.Root>
  );
}
