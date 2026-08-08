import {
  Badge,
  Box,
  Button,
  Flex,
  IconButton,
  Popover,
  Text,
} from "@radix-ui/themes";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { PiPlus, PiX } from "react-icons/pi";
import { SelectCombobox } from "../../../../components/inputs/combobox/SelectCombobox";
import type { ComboboxOption } from "../../../../components/inputs/combobox/types";
import { featuresQueryOptions } from "../../../../lib/queries/features";
import { featureSuggestionsQueryOptions } from "../../../../lib/queries/suggestions";

const FEATURE_SEARCH_ID = "feature-search";

type Props = {
  selectedIds: number[];
  onChange: (ids: number[]) => void;
};

/** Popover to select the features a taxon must carry. */
export function FeatureFilterField({ selectedIds, onChange }: Props) {
  const [searchQ, setSearchQ] = useState("");

  const { data: searchData, isLoading } = useQuery({
    ...featureSuggestionsQueryOptions(searchQ),
  });

  // Grab labels for chips using IDs
  const { data: selectedData } = useQuery({
    ...featuresQueryOptions(1, 100, { ids: selectedIds }),
    enabled: selectedIds.length > 0,
  });

  // Already-picked features shouldn't be offered again
  const options: ComboboxOption[] = (searchData ?? [])
    .filter((f) => !selectedIds.includes(f.id))
    .map((f) => ({
      id: f.id,
      label: f.label,
      hint: f.description || undefined,
    }));

  const selected = selectedData?.items ?? [];

  const add = (option: ComboboxOption | null) => {
    // Don't add if already selected
    if (!option || selectedIds.includes(option.id)) return;
    onChange([...selectedIds, option.id]);
  };

  const remove = (id: number) => onChange(selectedIds.filter((s) => s !== id));

  return (
    <Box>
      <SelectCombobox.Root
        id={FEATURE_SEARCH_ID}
        value={null}
        onValueChange={add}
        options={options}
        onQueryChange={setSearchQ}
        loading={isLoading}
      >
        <Flex align="center" justify="between" gap="2" mb="1">
          <Text as="label" htmlFor={FEATURE_SEARCH_ID} size="1" color="gray">
            Must have features
          </Text>
          <Popover.Trigger>
            <Button
              id={FEATURE_SEARCH_ID}
              size="1"
              color="gray"
              variant="surface"
            >
              <PiPlus /> Add feature
            </Button>
          </Popover.Trigger>
        </Flex>

        <SelectCombobox.Content align="end" behavior="input">
          <SelectCombobox.Input placeholder="Search features…" autoFocus />
          <SelectCombobox.List>
            {options.map((option, index) => (
              <SelectCombobox.Item
                key={option.id}
                option={option}
                index={index}
              />
            ))}
          </SelectCombobox.List>
        </SelectCombobox.Content>
      </SelectCombobox.Root>

      {selectedIds.length > 0 && (
        <>
          <Flex gap="1" wrap="wrap">
            {selected.map((f) => (
              <Badge key={f.id}>
                {f.label}
                <IconButton
                  size="1"
                  variant="ghost"
                  color="tomato"
                  aria-label={`Remove ${f.label} filter`}
                  onClick={() => remove(f.id)}
                >
                  <PiX size="0.75rem" />
                </IconButton>
              </Badge>
            ))}
          </Flex>
        </>
      )}
    </Box>
  );
}
