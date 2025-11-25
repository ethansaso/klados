import { Box, Flex } from "@radix-ui/themes";
import { useServerFn } from "@tanstack/react-start";
import * as React from "react";
import { InputCombobox } from "../../../../../../components/inputs/combobox/InputCombobox";
import { ComboboxOption } from "../../../../../../components/inputs/combobox/types";
import { searchGroupTraitSuggestions } from "../../../../../../lib/serverFns/character-suggestions/fns";
import { TraitSuggestion } from "../../../../../../lib/serverFns/character-suggestions/types";

type GroupTraitSearchProps = {
  groupId: number;
  /** Called whenever the user selects a suggestion. */
  onSelect: (suggestion: TraitSuggestion) => void;
  /** Optional placeholder text in the search input. */
  placeholder?: string;
};

export function GroupTraitSearch({
  groupId,
  onSelect,
  placeholder = "Type a value or trait…",
}: GroupTraitSearchProps) {
  const [suggestions, setSuggestions] = React.useState<TraitSuggestion[]>([]);
  const [options, setOptions] = React.useState<ComboboxOption[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [selectedOption, setSelectedOption] =
    React.useState<ComboboxOption | null>(null);

  const serverSearch = useServerFn(searchGroupTraitSuggestions);

  // Simple "request id" guard so stale responses don't win.
  const requestIdRef = React.useRef(0);

  const handleQueryChange = React.useCallback(
    async (q: string) => {
      const trimmed = q.trim();
      if (!trimmed) {
        setSuggestions([]);
        setOptions([]);
        setLoading(false);
        return;
      }

      const requestId = ++requestIdRef.current;
      setLoading(true);

      try {
        const result = await serverSearch({
          data: { groupId, q: trimmed, limit: 20 },
        });

        // Ignore stale responses
        if (requestId !== requestIdRef.current) return;

        setSuggestions(result);

        const nextOptions: ComboboxOption[] = result.map((s, index) => {
          const primaryLabel =
            s.kind === "categorical-value" ? s.traitValueLabel : s.displayValue;

          return {
            id: index, // index into `suggestions`
            label: primaryLabel,
            hint: s.characterLabel,
          };
        });

        setOptions(nextOptions);
      } catch {
        if (requestId !== requestIdRef.current) return;
        setSuggestions([]);
        setOptions([]);
      } finally {
        if (requestId === requestIdRef.current) {
          setLoading(false);
        }
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

      // Reset selection so the combobox remains reusable.
      // Let the popover close first, then clear.
      setTimeout(() => {
        setSelectedOption(null);
      }, 0);
    },
    [suggestions, onSelect]
  );

  const rootId = React.useId();

  return (
    <Box>
      <Flex direction="column" gap="1">
        <InputCombobox.Root
          id={rootId}
          value={selectedOption}
          onValueChange={handleValueChange}
          options={options}
          onQueryChange={handleQueryChange}
          loading={loading}
          size="1"
        >
          <InputCombobox.Input id={rootId} placeholder={placeholder} />
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
