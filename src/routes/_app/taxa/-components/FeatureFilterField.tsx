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

const FEATURE_SEARCH_ID = "feature-search";

type Props = {
  selectedIds: number[];
  onChange: (ids: number[]) => void;
};

/**
 * Picks the features a taxon must carry. Selecting a broad feature also matches
 * taxa that only carry a narrower one beneath it, so the hint below spells that
 * out — otherwise "sporocarp" returning cap-only taxa reads as a bug.
 */
export function FeatureFilterField({ selectedIds, onChange }: Props) {
  // SelectCombobox.Root owns the popover's open state, so tracking it here too
  // would desync on Escape/outside-click. A one-way latch is enough to keep the
  // feature list from being fetched before the picker is ever opened.
  const [hasOpened, setHasOpened] = useState(false);
  const [searchQ, setSearchQ] = useState("");

  const { data: searchData, isLoading } = useQuery({
    ...featuresQueryOptions(1, 20, searchQ ? { q: searchQ } : undefined),
    enabled: hasOpened,
  });

  // Resolve the selected ids to labels for the chips. Selections live in the
  // URL as bare ids, so this is what survives a page load or a shared link.
  const { data: selectedData } = useQuery({
    ...featuresQueryOptions(1, 100, { ids: selectedIds }),
    enabled: selectedIds.length > 0,
  });

  const selected = selectedData?.items ?? [];

  // Already-picked features shouldn't be offered again
  const options: ComboboxOption[] = (searchData?.items ?? [])
    .filter((f) => !selectedIds.includes(f.id))
    .map((f) => ({
      id: f.id,
      label: f.label,
      hint: f.description || undefined,
    }));

  // Selection is transient — each pick appends to the list rather than becoming
  // the combobox's own value, so `value` stays null.
  const add = (option: ComboboxOption | null) => {
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
          {/* Replaces SelectCombobox.Trigger: same popover, "add to a list"
              affordance instead of a select-style field showing one value. */}
          <Popover.Trigger>
            <Button
              id={FEATURE_SEARCH_ID}
              size="1"
              color="gray"
              variant="surface"
              onClick={() => setHasOpened(true)}
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
