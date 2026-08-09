import { Box, Flex, Text } from "@radix-ui/themes";
import { useQuery } from "@tanstack/react-query";
import * as React from "react";
import { InputCombobox } from "../../../../../../../components/inputs/combobox/InputCombobox";
import type { ComboboxOption } from "../../../../../../../components/inputs/combobox/types";
import { featureSuggestionsQueryOptions } from "../../../../../../../lib/queries/suggestions";

export const FEATURE_SEARCH_INPUT_ID = "feature-search";

interface FeatureSearchProps {
  onSelect: (feature: ComboboxOption) => void;
  /** Called when the user presses / with an empty input. */
  onDownShortcut?: () => void;
}

export const FeatureSearch = ({
  onSelect,
  onDownShortcut,
}: FeatureSearchProps) => {
  const [searchQ, setSearchQ] = React.useState("");

  const { data, isLoading } = useQuery(featureSuggestionsQueryOptions(searchQ));
  const options: ComboboxOption[] = (data ?? []).map((f) => ({
    id: f.id,
    label: f.label,
    hint: f.description ?? undefined,
  }));

  const handleSelect = (value: string) => {
    const opt = options.find((o) => String(o.id) === value);
    if (opt) onSelect(opt);
  };

  return (
    <Box>
      <InputCombobox.Root
        id={FEATURE_SEARCH_INPUT_ID}
        onSelect={handleSelect}
        onQueryChange={setSearchQ}
        loading={isLoading}
      >
        <InputCombobox.Input
          placeholder="Search features…"
          onKeyDown={(e) => {
            if (e.key === "/" && !e.currentTarget.value && onDownShortcut) {
              e.preventDefault();
              onDownShortcut();
            }
          }}
        />
        <InputCombobox.Popover>
          <InputCombobox.List isEmpty={options.length === 0}>
            {options.map((opt) => (
              <InputCombobox.Item key={opt.id} value={String(opt.id)}>
                <Flex align="baseline" gap="2" overflow="hidden">
                  <Text
                    as="p"
                    truncate
                    weight="medium"
                    className="input-combobox__item-label"
                  >
                    {opt.label}
                  </Text>
                  {opt.hint && (
                    <Text
                      as="p"
                      size="1"
                      color="gray"
                      truncate
                      className="input-combobox__item-hint"
                    >
                      {opt.hint}
                    </Text>
                  )}
                </Flex>
              </InputCombobox.Item>
            ))}
          </InputCombobox.List>
        </InputCombobox.Popover>
      </InputCombobox.Root>
    </Box>
  );
};
