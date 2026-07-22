import { Box } from "@radix-ui/themes";
import { useServerFn } from "@tanstack/react-start";
import { useCallback, useId, useRef, useState } from "react";
import { InputCombobox } from "../../../../../../../components/inputs/combobox/InputCombobox";
import type { ComboboxOption } from "../../../../../../../components/inputs/combobox/types";
import type { TraitSuggestion } from "../../../../../../../lib/domain/suggestions/types";
import { listCharacterStateSuggestionsFn } from "../../../../../../../lib/server-fns/character-suggestions/listCharacterStateSuggestionsFn";

type FeatureStateSearchProps = {
  featureId: number;
  /** Called whenever the user selects a suggestion. */
  onSelect: (suggestion: TraitSuggestion) => void;
  /** Optional placeholder text in the search input. */
  placeholder?: string;
  /** Called when the user presses / with an empty input. */
  onModifyShortcut?: () => void;
  /** Called when the user presses Escape. */
  onEscapeShortcut?: () => void;
  /** Stable HTML id for the search input (used for external focus). */
  inputId?: string;
};

export function CharacterStateSearch({
  featureId,
  onSelect,
  placeholder = "Type a value or trait…",
  onModifyShortcut,
  onEscapeShortcut,
  inputId,
}: FeatureStateSearchProps) {
  const [suggestions, setSuggestions] = useState<TraitSuggestion[]>([]);
  const [options, setOptions] = useState<ComboboxOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedOption, setSelectedOption] = useState<ComboboxOption | null>(
    null,
  );

  const serverSearch = useServerFn(listCharacterStateSuggestionsFn);

  // Simple "request id" guard so stale responses don't win.
  const requestIdRef = useRef(0);

  const handleQueryChange = useCallback(
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
          data: { featureId, q: trimmed, limit: 20 },
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
    [featureId, serverSearch],
  );

  const handleValueChange = useCallback(
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
    [suggestions, onSelect],
  );

  const fallbackId = useId();
  const rootId = inputId ?? fallbackId;

  return (
    <Box>
      <InputCombobox.Root
        id={rootId}
        value={selectedOption}
        onValueChange={handleValueChange}
        options={options}
        onQueryChange={handleQueryChange}
        loading={loading}
        size="1"
      >
        <InputCombobox.Input
          id={rootId}
          placeholder={placeholder}
          onKeyDown={(e) => {
            if (e.key === "/" && !e.currentTarget.value && onModifyShortcut) {
              e.preventDefault();
              onModifyShortcut();
            } else if (e.key === "Escape" && onEscapeShortcut) {
              e.preventDefault();
              onEscapeShortcut();
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
}
