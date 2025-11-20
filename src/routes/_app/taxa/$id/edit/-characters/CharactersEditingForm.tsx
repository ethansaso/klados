import { Box, Heading } from "@radix-ui/themes";
import { useQuery } from "@tanstack/react-query";
import * as React from "react";
import { InputCombobox } from "../../../../../../components/inputs/combobox/InputCombobox";
import { ComboboxOption } from "../../../../../../components/inputs/combobox/types";
import { characterGroupsQueryOptions } from "../../../../../../lib/queries/characterGroups";

// We'll refine this later when we know the shape of `characters`.
export type CharactersFormValue = unknown;

type CharacterEditingFormProps = {
  value: CharactersFormValue;
  onChange: (next: CharactersFormValue) => void;
};

export function CharacterEditingForm({
  value,
  onChange,
}: CharacterEditingFormProps) {
  const [searchQ, setSearchQ] = React.useState("");
  const [selectedOption, setSelectedOption] =
    React.useState<ComboboxOption | null>(null);

  // First page of groups, filtered by q.
  const { data, isLoading } = useQuery(
    characterGroupsQueryOptions(1, 20, searchQ ? { q: searchQ } : undefined)
  );

  const groups = data?.items ?? [];

  const options: ComboboxOption[] = groups.map((g) => ({
    id: g.id,
    label: g.label,
    hint: g.key ?? undefined,
  }));

  const handleGroupSelect = (opt: ComboboxOption | null) => {
    if (!opt) {
      setSelectedOption(null);
      return;
    }

    setSelectedOption(opt);

    const group = groups.find((g) => g.id === opt.id) ?? null;

    console.log("CharacterEditingForm: group selected", {
      group,
      charactersValue: value,
    });

    // For now, don't mutate characters field; just keep RHF happy.
    onChange(value);
  };

  return (
    <Box mb="3">
      <Heading size="3">Characters</Heading>
      <Box>
        <InputCombobox.Root
          id="character-group-search"
          value={selectedOption}
          onValueChange={handleGroupSelect}
          options={options}
          onQueryChange={setSearchQ}
          loading={isLoading}
        >
          <Box mb="1">
            <InputCombobox.Label>Group search</InputCombobox.Label>
          </Box>
          <InputCombobox.Input
            placeholder="Search character groups…"
            size="2"
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
    </Box>
  );
}
