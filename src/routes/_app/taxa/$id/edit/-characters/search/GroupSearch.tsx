import { Box } from "@radix-ui/themes";
import { useQuery } from "@tanstack/react-query";
import { Label } from "radix-ui";
import * as React from "react";
import { InputCombobox } from "../../../../../../../components/inputs/combobox/InputCombobox";
import { ComboboxOption } from "../../../../../../../components/inputs/combobox/types";
import { characterGroupsQueryOptions } from "../../../../../../../lib/queries/characterGroups";

interface GroupSearchProps {
  onSelect: (group: ComboboxOption) => void;
}

export const GroupSearch = ({ onSelect }: GroupSearchProps) => {
  const [searchQ, setSearchQ] = React.useState("");

  // First page of groups, filtered by q.
  const { data, isLoading } = useQuery(
    characterGroupsQueryOptions(1, 20, searchQ ? { q: searchQ } : undefined),
  );
  const groupQueryResults = data?.items ?? [];
  const options: ComboboxOption[] = groupQueryResults.map((g) => ({
    id: g.id,
    label: g.label,
    hint: g.key ?? undefined,
  }));

  const handleGroupSelect = (opt: ComboboxOption | null) => {
    if (!opt) {
      return;
    }

    onSelect(opt);
  };
  return (
    <Box>
      <Box mb="1">
        <Label.Root htmlFor="character-group-search">Add Group</Label.Root>
      </Box>
      <InputCombobox.Root
        id="character-group-search"
        value={null}
        onValueChange={handleGroupSelect}
        options={options}
        onQueryChange={setSearchQ}
        loading={isLoading}
      >
        <InputCombobox.Input placeholder="Search groups…" />
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
