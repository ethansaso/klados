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
import { type PropsWithChildren, useState } from "react";
import { PiX } from "react-icons/pi";
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
  selected: TaxonFilterToken[];
  onChange: (tokens: TaxonFilterToken[]) => void;
};
type FeatureOption = ComboboxOption & { id: number };
type StateOption = ComboboxOption & { suggestion: TraitSuggestion };

/**
 * Popover to add one filter chip for a feature, character, or both.
 * Numeric and range states need a feature, since a naked "4 cm" is nonsense.
 */
export function TaxonStateFilterPopover({
  selected,
  onChange,
  children,
}: PropsWithChildren<Props>) {
  const [open, setOpen] = useState(false);
  const [feature, setFeature] = useState<FeatureOption | null>(null);
  const [state, setState] = useState<StateOption | null>(null);
  const [featureQ, setFeatureQ] = useState("");
  const [stateQ, setStateQ] = useState("");

  const { data: featureData, isFetching: featuresLoading } = useQuery(
    featureSuggestionsQueryOptions(featureQ),
  );
  const { data: suggestions, isFetching: statesLoading } = useQuery(
    characterStateFilterSuggestionsQueryOptions({
      q: stateQ,
      featureId: feature?.id,
    }),
  );
  const featureOptions: FeatureOption[] = (featureData ?? []).map((f) => ({
    id: f.id,
    label: f.label,
  }));

  const selectedKeys = new Set(selected.map(filterTokenKey));

  // Suggestions have no id of their own; the filter they'd make is unique.
  const stateOptions = (suggestions ?? []).flatMap((suggestion) => {
    const token = tokenFromSuggestion(suggestion, feature?.id);
    if (!token || selectedKeys.has(filterTokenKey(token))) return [];

    const option: StateOption = {
      id: filterTokenKey(token),
      label:
        suggestion.kind === "categorical-value"
          ? suggestion.traitValueLabel
          : suggestion.displayValue,
      hint: suggestion.characterLabel,
      suggestion,
    };
    return [option];
  });

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

  // Scoping to a different feature can invalidate picked state.
  const changeFeature = (next: FeatureOption | null) => {
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

  return (
    <Popover.Root open={open} onOpenChange={reset}>
      <Popover.Trigger>{children}</Popover.Trigger>
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
            loading={featuresLoading}
          >
            <SelectCombobox.Trigger placeholder="Any feature" />
            <SelectCombobox.Content matchTriggerWidth>
              <SelectCombobox.Input placeholder="Search features…" />
              <SelectCombobox.List />
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
                Numeric and range character states can only be searched with a
                feature selected.
                <br />
                <br />
                In other words, you cannot search for simply &ldquo;diameter 4
                cm&rdquo;, only &ldquo;cap diameter 4 cm&rdquo;.
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
            value={state}
            onValueChange={setState}
            options={stateOptions}
            onQueryChange={setStateQ}
            loading={statesLoading}
          >
            <SelectCombobox.Trigger placeholder="Any state" />
            <SelectCombobox.Content matchTriggerWidth>
              <SelectCombobox.Input
                placeholder={
                  feature ? `Search ${feature.label} states…` : "Search states…"
                }
              />
              <SelectCombobox.List />
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
  );
}

/** Removable chips for the active filters. */
export function TaxonStateFilterChips({ selected, onChange }: Props) {
  const { data: chips } = useQuery(filterChipsQueryOptions(selected));

  const labelByKey = new Map(
    (chips ?? []).map((chip) => [chip.key, chip.label]),
  );

  const remove = (key: string) =>
    onChange(selected.filter((token) => filterTokenKey(token) !== key));

  if (!selected.length) return null;
  return (
    <Flex gap="1" wrap="wrap">
      {selected.map((token) => {
        const key = filterTokenKey(token);
        // Undefined before resolved via query.
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

  // A numeric filter is only meaningful when scoped to a feature.
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
