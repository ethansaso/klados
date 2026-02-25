import { Box } from "@radix-ui/themes";
import { useQuery } from "@tanstack/react-query";
import { Label } from "radix-ui";
import * as React from "react";
import { InputCombobox } from "../../../../../../../components/inputs/combobox/InputCombobox";
import type { ComboboxOption } from "../../../../../../../components/inputs/combobox/types";
import { featuresQueryOptions } from "../../../../../../../lib/queries/features";

interface FeatureSearchProps {
  onSelect: (feature: ComboboxOption) => void;
}

export const FeatureSearch = ({ onSelect }: FeatureSearchProps) => {
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
      <Box mb="1">
        <Label.Root htmlFor="feature-search">Add Feature</Label.Root>
      </Box>
      <InputCombobox.Root
        id="feature-search"
        value={null}
        onValueChange={handleFeatureSelect}
        options={options}
        onQueryChange={setSearchQ}
        loading={isLoading}
      >
        <InputCombobox.Input placeholder="Search features…" />
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
