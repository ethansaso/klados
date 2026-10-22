import { Badge, Box, Button, Flex, Link, Text } from "@radix-ui/themes";
import { useQuery } from "@tanstack/react-query";
import { useId, useState } from "react";
import { InputCombobox } from "../../../../../../../components/inputs/combobox/InputCombobox";
import type { ComboboxOption } from "../../../../../../../components/inputs/combobox/types";
import { ColorBubble } from "../../../../../../../components/state-formatting/helpers/ColorBubble";
import type { TraitSuggestion } from "../../../../../../../lib/domain/suggestions/types";
import { characterStateSuggestionsQueryOptions } from "../../../../../../../lib/queries/suggestions";
import "./CharacterStateSearch.css";

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
type SuggestionOption = ComboboxOption & { suggestion: TraitSuggestion };

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
  const [q, setQ] = useState("");
  const { data, isFetching } = useQuery(
    characterStateSuggestionsQueryOptions(featureId, q.trim()),
  );
  const options: SuggestionOption[] = (data ?? []).map((suggestion) => ({
    id: suggestionKey(suggestion),
    label: suggestionLabel(suggestion),
    suggestion,
  }));

  const fallbackId = useId();
  const rootId = inputId ?? fallbackId;

  return (
    <Box>
      <InputCombobox.Root
        id={rootId}
        options={options}
        onSelect={(opt) => onSelect(opt.suggestion)}
        onQueryChange={setQ}
        loading={isFetching}
        renderItem={({ label, suggestion: s }) => (
          <Flex align="baseline" gap="2" overflow="hidden">
            <Text as="p" weight="medium" style={{ flexShrink: 0 }}>
              {label}
            </Text>

            {s.kind === "categorical-value" && s.traitValueDescription && (
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

            <Badge size="1" color="gray" ml="auto" style={{ flexShrink: 0 }}>
              {s.kind === "categorical-value" && s.traitValueHexCode && (
                <ColorBubble hexColor={s.traitValueHexCode} />
              )}
              {s.characterLabel}
            </Badge>
          </Flex>
        )}
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
        <InputCombobox.Content matchTriggerWidth>
          <InputCombobox.List />
          <Box m="-2" p="2" mt="2" className="character-search__feature-footer">
            <Button asChild size="1" variant="ghost">
              <Link
                href={`/glossary/features/${featureId}`}
                target="_blank"
                rel="noreferrer"
              >
                <Text as="p">Edit feature in glossary</Text>
              </Link>
            </Button>
          </Box>
        </InputCombobox.Content>
      </InputCombobox.Root>
    </Box>
  );
}
