import {
  Button,
  Checkbox,
  Flex,
  Popover,
  Select,
  Switch,
  Text,
} from "@radix-ui/themes";
import { useMemo } from "react";
import {
  TAXON_RANKS_DESCENDING,
  TAXON_STATUSES,
  type TaxonStatus,
} from "../../../../../db/schema/schema";
import {
  DEFAULT_TAXON_STATUSES,
  type TaxonSearchParams,
} from "../../../../lib/domain/taxa/search";
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

/** True when the selection is anything other than the default statuses. */
function isStatusFiltered(status: TaxonStatus[]) {
  return (
    status.length !== DEFAULT_TAXON_STATUSES.length ||
    !DEFAULT_TAXON_STATUSES.every((s) => status.includes(s))
  );
}

export function TaxonFilters({ search, setSearch }: Props) {
  const rankFiltered = !!(search.highRank || search.lowRank);
  const statusFiltered = useMemo(
    () => isStatusFiltered(search.status),
    [search.status],
  );
  const qualityFiltered = QUALITY_FLAGS.some((flag) => !!search[flag.key]);

  const toggleStatus = (status: TaxonStatus, checked: boolean) => {
    const next = checked
      ? TAXON_STATUSES.filter((s) => s === status || search.status.includes(s))
      : search.status.filter((s) => s !== status);

    setSearch({ status: next });
  };

  return (
    <Flex gap="2">
      <Popover.Root>
        <Popover.Trigger>
          <Button
            type="button"
            size="2"
            variant={rankFiltered ? "solid" : "outline"}
          >
            Rank
          </Button>
        </Popover.Trigger>
        <Popover.Content>
          <Flex direction="column" gap="3" style={{ minWidth: 224 }}>
            {/* High rank */}
            <Flex direction="column" gap="1">
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
            <Flex direction="column" gap="1">
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
        </Popover.Content>
      </Popover.Root>

      <Popover.Root>
        <Popover.Trigger>
          <Button
            type="button"
            size="2"
            variant={statusFiltered ? "solid" : "outline"}
          >
            Status
          </Button>
        </Popover.Trigger>
        <Popover.Content>
          <Flex direction="column" gap="2" style={{ minWidth: 180 }}>
            {TAXON_STATUSES.map((status) => (
              <Text key={status} as="label" size="2">
                <Flex align="center" gap="2">
                  <Checkbox
                    checked={search.status.includes(status)}
                    onCheckedChange={(checked) =>
                      toggleStatus(status, checked === true)
                    }
                  />
                  {capitalizeFirstLetter(status)}
                </Flex>
              </Text>
            ))}
          </Flex>
        </Popover.Content>
      </Popover.Root>

      <Popover.Root>
        <Popover.Trigger>
          <Button
            type="button"
            size="2"
            variant={qualityFiltered ? "solid" : "outline"}
          >
            Quality
          </Button>
        </Popover.Trigger>
        <Popover.Content>
          <Flex direction="column" gap="2" style={{ minWidth: 180 }}>
            {QUALITY_FLAGS.map(({ key, label }) => (
              <Flex key={key} align="center" gap="2">
                <Switch
                  id={key}
                  checked={!!search[key]}
                  onCheckedChange={(checked) =>
                    setSearch({
                      [key]: checked ? true : undefined,
                    } as Partial<TaxonSearchParams>)
                  }
                />
                <Text as="label" htmlFor={key} size="2">
                  {label}
                </Text>
              </Flex>
            ))}
          </Flex>
        </Popover.Content>
      </Popover.Root>
    </Flex>
  );
}
