import { Badge, Box, Flex, Text } from "@radix-ui/themes";
import { useServerFn } from "@tanstack/react-start";
import { useCallback, useId, useRef, useState } from "react";
import { InputCombobox } from "../../../../../../../components/inputs/combobox/InputCombobox";
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

function suggestionLabel(s: TraitSuggestion): string {
  return s.kind === "categorical-value" ? s.traitValueLabel : s.displayValue;
}

function suggestionKey(s: TraitSuggestion): string {
  // displayValue includes the unit symbol, so numeric suggestions expanded
  // across units stay unique per character.
  return s.kind === "categorical-value"
    ? `cat:${s.characterId}:${s.traitValueId}`
    : `${s.kind}:${s.characterId}:${s.displayValue}`;
}

export function CharacterStateSearch({
  featureId,
  onSelect,
  placeholder = "Type a value or trait…",
  onModifyShortcut,
  onEscapeShortcut,
  inputId,
}: FeatureStateSearchProps) {
  const [suggestions, setSuggestions] = useState<TraitSuggestion[]>([]);
  const [loading, setLoading] = useState(false);

  const serverSearch = useServerFn(listCharacterStateSuggestionsFn);

  // Simple "request id" guard so stale responses don't win.
  const requestIdRef = useRef(0);

  const handleQueryChange = useCallback(
    async (q: string) => {
      const trimmed = q.trim();
      if (!trimmed) {
        setSuggestions([]);
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
      } catch {
        if (requestId !== requestIdRef.current) return;
        setSuggestions([]);
      } finally {
        if (requestId === requestIdRef.current) {
          setLoading(false);
        }
      }
    },
    [featureId, serverSearch],
  );

  // Item values are indices into `suggestions`.
  const handleSelect = useCallback(
    (value: string) => {
      const suggestion = suggestions[Number(value)];
      if (suggestion) {
        onSelect(suggestion);
      }
    },
    [suggestions, onSelect],
  );

  const fallbackId = useId();
  const rootId = inputId ?? fallbackId;

  return (
    <Box>
      <InputCombobox.Root
        id={rootId}
        onSelect={handleSelect}
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
        <InputCombobox.Popover matchTriggerWidth>
          <InputCombobox.List isEmpty={suggestions.length === 0}>
            {suggestions.map((s, index) => (
              <InputCombobox.Item key={suggestionKey(s)} value={String(index)}>
                <Flex align="baseline" gap="2" overflow="hidden">
                  <Text as="p" weight="medium" style={{ flexShrink: 0 }}>
                    {suggestionLabel(s)}
                  </Text>

                  {s.kind === "categorical-value" &&
                    s.traitValueDescription && (
                      <Text
                        as="p"
                        size="1"
                        color="gray"
                        truncate
                        style={{ minWidth: 0 }}
                      >
                        {s.traitValueDescription}
                      </Text>
                    )}

                  <Badge
                    size="1"
                    color="gray"
                    ml="auto"
                    style={{ flexShrink: 0 }}
                  >
                    {s.characterLabel}
                  </Badge>
                </Flex>
              </InputCombobox.Item>
            ))}
          </InputCombobox.List>
        </InputCombobox.Popover>
      </InputCombobox.Root>
    </Box>
  );
}
