import { Box } from "@radix-ui/themes";
import { useQuery } from "@tanstack/react-query";
import * as React from "react";
import { InputCombobox } from "../../../../../../../components/inputs/combobox/InputCombobox";
import type { ComboboxOption } from "../../../../../../../components/inputs/combobox/types";
import { featuresQueryOptions } from "../../../../../../../lib/queries/features";

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

  // First page of features, filtered by q.
  const { data, isLoading } = useQuery(
    featuresQueryOptions(1, 20, searchQ ? { q: searchQ } : undefined),
  );
  const featureQueryResults = data?.items ?? [];
  const options: ComboboxOption[] = featureQueryResults.map((f) => ({
    id: f.id,
    label: f.label,
    hint: f.description ?? undefined,
  }));

  const handleFeatureSelect = (opt: ComboboxOption | null) => {
    if (!opt) {
      return;
    }

    onSelect(opt);
  };
  return (
    <Box>
      <InputCombobox.Root
        id={FEATURE_SEARCH_INPUT_ID}
        value={null}
        onValueChange={handleFeatureSelect}
        options={options}
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
          <InputCombobox.List>
            {options.map((opt) => (
              <InputCombobox.Item key={opt.id} option={opt} />
            ))}
          </InputCombobox.List>
        </InputCombobox.Popover>
      </InputCombobox.Root>
    </Box>
  );
};
