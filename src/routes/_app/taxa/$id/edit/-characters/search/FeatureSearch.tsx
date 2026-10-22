import { Box } from "@radix-ui/themes";
import { useQuery } from "@tanstack/react-query";
import * as React from "react";
import { InputCombobox } from "../../../../../../../components/inputs/combobox/InputCombobox";
import type { ComboboxOption } from "../../../../../../../components/inputs/combobox/types";
import { featureSuggestionsQueryOptions } from "../../../../../../../lib/queries/suggestions";

export type FeatureOption = ComboboxOption & { id: number };
interface FeatureSearchProps {
  onSelect: (feature: FeatureOption) => void;
  /** Called when the user presses / with an empty input. */
  onDownShortcut?: () => void;
}

export const FEATURE_SEARCH_INPUT_ID = "feature-search";

export const FeatureSearch = ({
  onSelect,
  onDownShortcut,
}: FeatureSearchProps) => {
  const [searchQ, setSearchQ] = React.useState("");

  const { data, isLoading } = useQuery(featureSuggestionsQueryOptions(searchQ));
  const options: FeatureOption[] = (data ?? []).map((f) => ({
    id: f.id,
    label: f.label,
    hint: f.description ?? undefined,
  }));

  return (
    <Box>
      <InputCombobox.Root
        id={FEATURE_SEARCH_INPUT_ID}
        options={options}
        onSelect={onSelect}
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
        <InputCombobox.Content>
          <InputCombobox.List />
        </InputCombobox.Content>
      </InputCombobox.Root>
    </Box>
  );
};
