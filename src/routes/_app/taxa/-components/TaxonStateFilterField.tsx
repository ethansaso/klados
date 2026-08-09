import {
  Badge,
  Box,
  Button,
  Flex,
  IconButton,
  Popover,
  Spinner,
  Text,
} from "@radix-ui/themes";
import { useQuery } from "@tanstack/react-query";
import { type ReactNode, useState } from "react";
import { PiPlus, PiX } from "react-icons/pi";
import { ResponsiveTooltip } from "../../../../components/ResponsiveTooltip";
import { SelectCombobox } from "../../../../components/inputs/combobox/SelectCombobox";
import type { ComboboxOption } from "../../../../components/inputs/combobox/types";
import type { TraitSuggestion } from "../../../../lib/domain/suggestions/types";
import type { TaxonFilterToken } from "../../../../lib/domain/taxa/search";
import { filterTokenKey } from "../../../../lib/domain/taxa/utils";
import { filterChipsQueryOptions } from "../../../../lib/queries/filterChips";
import {
  characterStateFilterSuggestionsQueryOptions,
  featureSuggestionsQueryOptions,
} from "../../../../lib/queries/suggestions";

const FEATURE_ID = "filter-feature";
const STATE_ID = "filter-state";

type Props = {
  /** Section heading, rendered inline with the trigger. */
  label: ReactNode;
  selected: TaxonFilterToken[];
  onChange: (tokens: TaxonFilterToken[]) => void;
};

/**
 * Popover to add one filter: a feature, a character state, or a state on a
 * feature. Numeric and range states need a feature, since "4 cm" is only
 * meaningful once you say of what.
 */
export function TaxonStateFilterField({ label, selected, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [feature, setFeature] = useState<ComboboxOption | null>(null);
  // Combobox for display, suggestion for actual state
  const [state, setState] = useState<{
    option: ComboboxOption;
    suggestion: TraitSuggestion;
  } | null>(null);
  const [featureQ, setFeatureQ] = useState("");
  const [stateQ, setStateQ] = useState("");

  const { data: featureData } = useQuery(
    featureSuggestionsQueryOptions(featureQ),
  );
  const { data: suggestions, isLoading } = useQuery(
    characterStateFilterSuggestionsQueryOptions({
      q: stateQ,
      featureId: feature?.id,
    }),
  );
  const { data: chips } = useQuery(filterChipsQueryOptions(selected));

  const labelByKey = new Map(
    (chips ?? []).map((chip) => [chip.key, chip.label]),
  );

  const featureOptions: ComboboxOption[] = (featureData ?? []).map((f) => ({
    id: f.id,
    label: f.label,
  }));

  const selectedKeys = new Set(selected.map(filterTokenKey));

  // Suggestions have no id of their own, so options are keyed by position.
  const offered = (suggestions ?? []).filter((suggestion) => {
    const token = tokenFromSuggestion(suggestion, feature?.id);
    return token !== null && !selectedKeys.has(filterTokenKey(token));
  });
  const stateOptions: ComboboxOption[] = offered.map((suggestion, index) => ({
    id: index,
    label:
      suggestion.kind === "categorical-value"
        ? suggestion.traitValueLabel
        : suggestion.displayValue,
    hint: suggestion.characterLabel,
  }));

  const pending = state
    ? tokenFromSuggestion(state.suggestion, feature?.id)
    : feature
      ? ({ k: "f", f: feature.id } as const)
      : null;

  const reset = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      setFeature(null);
      setState(null);
      setFeatureQ("");
      setStateQ("");
    }
  };

  // Scoping to a different feature can invalidate the picked state.
  const changeFeature = (next: ComboboxOption | null) => {
    setFeature(next);
    setState(null);
  };

  const commit = () => {
    if (!pending) return;
    if (!selectedKeys.has(filterTokenKey(pending))) {
      onChange([...selected, pending]);
    }
    reset(false);
  };

  const remove = (key: string) =>
    onChange(selected.filter((token) => filterTokenKey(token) !== key));

  return (
    <Box>
      <Flex align="center" justify="between" gap="2" mb="2">
        {label}
        <Popover.Root open={open} onOpenChange={reset}>
          <Popover.Trigger>
            <Button size="1" color="gray" variant="surface">
              <PiPlus /> Add filter
            </Button>
          </Popover.Trigger>
          <Popover.Content align="end" width="320px" size="1">
            <Text as="label" htmlFor={FEATURE_ID} size="1" color="gray">
              Feature
            </Text>
            <Box mt="1" mb="3">
              <SelectCombobox.Root
                id={FEATURE_ID}
                value={feature}
                onValueChange={changeFeature}
                options={featureOptions}
                onQueryChange={setFeatureQ}
              >
                <SelectCombobox.Trigger placeholder="Any feature" />
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
              <Text as="label" htmlFor={STATE_ID} size="1" color="gray">
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
                  {feature ? "All character states" : "Categorical only"}
                </Text>
              </ResponsiveTooltip>
            </Flex>
            <Box mt="1">
              <SelectCombobox.Root
                id={STATE_ID}
                value={state?.option ?? null}
                onValueChange={(option) => {
                  const suggestion = option ? offered[option.id] : undefined;
                  setState(
                    option && suggestion ? { option, suggestion } : null,
                  );
                }}
                options={stateOptions}
                onQueryChange={setStateQ}
                loading={isLoading}
              >
                <SelectCombobox.Trigger placeholder="Any state" />
                <SelectCombobox.Content behavior="input" matchTriggerWidth>
                  <SelectCombobox.Input
                    placeholder={
                      feature
                        ? `Search ${feature.label} states…`
                        : "Search states…"
                    }
                  />
                  <SelectCombobox.List>
                    {stateOptions.map((option, index) => (
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

            <Flex mt="3" justify="end">
              <Button size="1" disabled={!pending} onClick={commit}>
                Add
              </Button>
            </Flex>
          </Popover.Content>
        </Popover.Root>
      </Flex>

      {selected.length > 0 && (
        <Flex gap="1" wrap="wrap">
          {selected.map((token) => {
            const key = filterTokenKey(token);
            // Undefined until resolved; null once resolved as undescribable.
            const label = labelByKey.get(key);

            return (
              <Badge key={key} color={label === null ? "tomato" : undefined}>
                {label === undefined ? (
                  <Spinner size="1" />
                ) : (
                  (label ?? "Unrecognized filter")
                )}
                <IconButton
                  size="1"
                  variant="ghost"
                  color="tomato"
                  aria-label={`Remove ${label ?? "unrecognized"} filter`}
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

function tokenFromSuggestion(
  suggestion: TraitSuggestion,
  featureId?: number,
): TaxonFilterToken | null {
  if (suggestion.kind === "categorical-value") {
    return {
      k: "c",
      f: featureId,
      c: suggestion.characterId,
      t: suggestion.traitValueId,
    };
  }

  // A numeric filter is only meaningful scoped to a feature.
  if (suggestion.kind === "numeric-single" && featureId !== undefined) {
    return {
      k: "n",
      f: featureId,
      c: suggestion.characterId,
      // Null for dimensionless characters, e.g. a spore count
      u: suggestion.displayUnitId ?? undefined,
      v: suggestion.value,
    };
  }

  return null;
}
