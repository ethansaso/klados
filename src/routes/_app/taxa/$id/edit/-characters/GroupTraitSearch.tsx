import { Box, Flex, Text } from "@radix-ui/themes";
import { useServerFn } from "@tanstack/react-start";
import * as React from "react";
import { InputCombobox } from "../../../../../../components/inputs/combobox/InputCombobox";
import { ComboboxOption } from "../../../../../../components/inputs/combobox/types";
import { searchGroupTraitSuggestions } from "../../../../../../lib/serverFns/character-suggestions/fns";
import { TraitSuggestion } from "../../../../../../lib/serverFns/character-suggestions/types";

type GroupTraitSearchProps = {
  groupId: number;
  label: string;
  /** Called whenever the user selects a suggestion. */
  onSelect: (suggestion: TraitSuggestion) => void;
  /** Optional placeholder text in the search input. */
  placeholder?: string;
};

export function GroupTraitSearch({
  groupId,
  label,
  onSelect,
  placeholder = "Type a value or trait…",
}: GroupTraitSearchProps) {
  const [suggestions, setSuggestions] = React.useState<TraitSuggestion[]>([]);
  const [options, setOptions] = React.useState<ComboboxOption[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [selectedOption, setSelectedOption] =
    React.useState<ComboboxOption | null>(null);

  const serverSearch = useServerFn(searchGroupTraitSuggestions);

  const handleQueryChange = React.useCallback(
    async (q: string) => {
      const trimmed = q.trim();
      if (!trimmed) {
        setSuggestions([]);
        setOptions([]);
        return;
      }

      setLoading(true);
      try {
        const result = await serverSearch({
          data: {
            groupId,
            q: trimmed,
            limit: 20,
          },
        });

        setSuggestions(result);

        // Map each suggestion to a ComboboxOption.
        // We use the array index as the ID, since ComboboxOption.id is numeric.
        const nextOptions: ComboboxOption[] = result.map((s, index) => {
          const primaryLabel =
            s.kind === "categorical-value" ? s.valueLabel : s.displayValue; // numeric single/range

          return {
            id: index,
            label: primaryLabel,
            hint: s.characterLabel,
          };
        });

        setOptions(nextOptions);
      } catch (err) {
        // You can add toast logging here if needed.
        setSuggestions([]);
        setOptions([]);
      } finally {
        setLoading(false);
      }
    },
    [groupId, serverSearch]
  );

  const handleValueChange = React.useCallback(
    (opt: ComboboxOption | null) => {
      setSelectedOption(opt);

      if (!opt) return;

      const suggestion = suggestions[opt.id];
      if (suggestion) {
        onSelect(suggestion);
      }

      // Clear the selection so the input stays focusable and "reusable".
      // We let the popover close via Combobox.Item, then reset local state.
      setTimeout(() => {
        setSelectedOption(null);
      }, 0);
    },
    [suggestions, onSelect]
  );

  return (
    <Box>
      <Flex direction="column" gap="1">
        <Text as="label" size="2" weight="medium">
          {label}
        </Text>

        <InputCombobox.Root
          id={label.toLowerCase().replace(/\s+/g, "-")}
          value={selectedOption}
          onValueChange={handleValueChange}
          options={options}
          onQueryChange={handleQueryChange}
          loading={loading}
        >
          <InputCombobox.Input placeholder={placeholder} />

          <InputCombobox.Popover>
            <InputCombobox.List>
              {options.map((opt) => (
                <InputCombobox.Item key={opt.id} option={opt} />
              ))}
            </InputCombobox.List>
          </InputCombobox.Popover>
        </InputCombobox.Root>
      </Flex>
    </Box>
  );
}
