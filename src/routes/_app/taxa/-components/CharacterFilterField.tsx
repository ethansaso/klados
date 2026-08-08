import {
  Badge,
  Box,
  Button,
  Flex,
  IconButton,
  Popover,
  Text,
} from "@radix-ui/themes";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { PiPlus, PiX } from "react-icons/pi";
import { ResponsiveTooltip } from "../../../../components/ResponsiveTooltip";
import { InputCombobox } from "../../../../components/inputs/combobox/InputCombobox";
import { SelectCombobox } from "../../../../components/inputs/combobox/SelectCombobox";
import type { ComboboxOption } from "../../../../components/inputs/combobox/types";
import type { TraitSuggestion } from "../../../../lib/domain/suggestions/types";
import type { CharacterStateFilterToken } from "../../../../lib/domain/taxa/search";
import {
  characterStateFilterSuggestionsQueryOptions,
  featureSuggestionsQueryOptions,
} from "../../../../lib/queries/suggestions";

const FEATURE_SCOPE_ID = "character-feature-scope";
const CHARACTER_SEARCH_ID = "character-search";

type Props = {
  selected: CharacterStateFilterToken[];
  onChange: (tokens: CharacterStateFilterToken[]) => void;
};

/**
 * Popover to select character states a taxon must carry,
 * optionally ascribed to a specific feature (or mandatorily for number/range)
 */
export function CharacterFilterField({ selected, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [scope, setScope] = useState<ComboboxOption | null>(null);
  const [featureQ, setFeatureQ] = useState("");
  const [stateQ, setStateQ] = useState("");

  const { data: featureData } = useQuery(
    featureSuggestionsQueryOptions(featureQ),
  );

  const { data: suggestions, isLoading } = useQuery(
    characterStateFilterSuggestionsQueryOptions({
      q: stateQ,
      featureId: scope?.id,
    }),
  );

  const featureOptions: ComboboxOption[] = (featureData ?? []).map(
    (feature) => ({ id: feature.id, label: feature.label }),
  );

  const selectedKeys = new Set(selected.map(tokenKey));
  const options = (suggestions ?? []).filter((suggestion) => {
    const token = tokenFromSuggestion(suggestion, scope?.id);
    return token !== null && !selectedKeys.has(tokenKey(token));
  });

  // Scope is per-session: it resets whenever the popover closes.
  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) {
      setScope(null);
      setFeatureQ("");
      setStateQ("");
    }
  };

  const add = (index: string) => {
    const suggestion = options[Number(index)];
    const token = suggestion && tokenFromSuggestion(suggestion, scope?.id);
    if (!token) return;

    handleOpenChange(false);
    if (!selectedKeys.has(tokenKey(token))) onChange([...selected, token]);
  };

  const remove = (key: string) =>
    onChange(selected.filter((token) => tokenKey(token) !== key));

  return (
    <Box>
      <Flex align="center" justify="between" gap="2" mb="1">
        <Text as="label" htmlFor={CHARACTER_SEARCH_ID} size="1" color="gray">
          Must have characters
        </Text>
        <Popover.Root open={open} onOpenChange={handleOpenChange}>
          <Popover.Trigger>
            <Button size="1" color="gray" variant="surface">
              <PiPlus /> Add character
            </Button>
          </Popover.Trigger>
          <Popover.Content align="end" width="320px" size="1">
            <Text as="label" htmlFor={FEATURE_SCOPE_ID} size="1" color="gray">
              Relevant feature
            </Text>
            <Box mt="1" mb="3">
              <SelectCombobox.Root
                id={FEATURE_SCOPE_ID}
                value={scope}
                onValueChange={setScope}
                options={featureOptions}
                onQueryChange={setFeatureQ}
              >
                <SelectCombobox.Trigger placeholder="All features" />
                <SelectCombobox.Content behavior="input" matchTriggerWidth>
                  <SelectCombobox.Input placeholder="Search features…" />
                  <SelectCombobox.List>
                    {featureOptions.map((option, index) => (
                      <SelectCombobox.Item
                        key={option.id}
                        option={option}
                        index={index}
                      />
                    ))}
                  </SelectCombobox.List>
                </SelectCombobox.Content>
              </SelectCombobox.Root>
            </Box>

            <Flex align="center" justify="between" gap="2">
              <Text
                as="label"
                htmlFor={CHARACTER_SEARCH_ID}
                size="1"
                color="gray"
              >
                Character state
              </Text>
              <ResponsiveTooltip
                content={
                  <>
                    Numeric and range character states can only be searched with
                    a feature selected.
                    <br />
                    <br />
                    In other terms, you cannot search for simply &ldquo;diameter
                    4 cm&rdquo;, only &ldquo;cap diameter 4 cm&rdquo;.
                  </>
                }
              >
                <Text size="1" color="gray" className="has-information">
                  {scope ? "All character states" : "Categorical only"}
                </Text>
              </ResponsiveTooltip>
            </Flex>
            <Box mt="1">
              <InputCombobox.Root
                id={CHARACTER_SEARCH_ID}
                size="2"
                onSelect={add}
                onQueryChange={setStateQ}
                loading={isLoading}
              >
                <InputCombobox.Input
                  id={CHARACTER_SEARCH_ID}
                  placeholder={
                    scope ? `Search ${scope.label} states…` : "Search states…"
                  }
                />
                <InputCombobox.Popover matchTriggerWidth>
                  <InputCombobox.List isEmpty={options.length === 0}>
                    {options.map((suggestion, index) => (
                      <InputCombobox.Item
                        key={tokenKey(
                          tokenFromSuggestion(suggestion, scope?.id)!,
                        )}
                        value={String(index)}
                      >
                        <Flex align="baseline" gap="2" overflow="hidden">
                          <Text
                            as="p"
                            weight="medium"
                            style={{ flexShrink: 0 }}
                          >
                            {suggestion.kind === "categorical-value"
                              ? suggestion.traitValueLabel
                              : suggestion.displayValue}
                          </Text>
                          <Text
                            as="p"
                            size="1"
                            color="gray"
                            truncate
                            style={{ minWidth: 0 }}
                          >
                            {scope
                              ? `${scope.label} · ${suggestion.characterLabel}`
                              : suggestion.characterLabel}
                          </Text>
                        </Flex>
                      </InputCombobox.Item>
                    ))}
                  </InputCombobox.List>
                </InputCombobox.Popover>
              </InputCombobox.Root>
            </Box>
          </Popover.Content>
        </Popover.Root>
      </Flex>

      {selected.length > 0 && (
        <Flex gap="1" wrap="wrap">
          {selected.map((token) => {
            const key = tokenKey(token);
            return (
              // TODO: resolve ids to labels, and render unresolvable tokens red
              <Badge key={key}>
                {key}
                <IconButton
                  size="1"
                  variant="ghost"
                  color="tomato"
                  aria-label={`Remove ${key} filter`}
                  onClick={() => remove(key)}
                >
                  <PiX size="0.75rem" />
                </IconButton>
              </Badge>
            );
          })}
        </Flex>
      )}
    </Box>
  );
}

/** Tokens are compared on identity, not object equality. */
function tokenKey(token: CharacterStateFilterToken) {
  return token.k === "c"
    ? `c:${token.f ?? "*"}:${token.c}:${token.t}`
    : `n:${token.f ?? "*"}:${token.c}:${token.u}:${token.v}`;
}

function tokenFromSuggestion(
  suggestion: TraitSuggestion,
  featureId?: number,
): CharacterStateFilterToken | null {
  if (suggestion.kind === "categorical-value") {
    return {
      k: "c",
      f: featureId,
      c: suggestion.characterId,
      t: suggestion.traitValueId,
    };
  }

  if (suggestion.kind === "numeric-single" && suggestion.displayUnitId) {
    return {
      k: "n",
      f: featureId,
      c: suggestion.characterId,
      u: suggestion.displayUnitId,
      v: suggestion.value,
    };
  }

  return null;
}
