import { Badge, Flex, IconButton, Spinner, Text } from "@radix-ui/themes";
import { useQuery } from "@tanstack/react-query";
import { PiExclamationMark, PiX } from "react-icons/pi";
import { ResponsiveTooltip } from "../../../../components/ResponsiveTooltip";
import type { TaxonFilterToken } from "../../../../lib/domain/taxa/search";
import { filterTokenKey } from "../../../../lib/domain/taxa/utils";
import { filterChipsQueryOptions } from "../../../../lib/queries/filterChips";
import { assumedFeatureNote } from "./TaxonStateFilter";
import "./TaxonStateFilterChips.css";

type Props = {
  selected: TaxonFilterToken[];
  onChange: (tokens: TaxonFilterToken[]) => void;
};

/** Removable chips for the active filters. */
export function TaxonStateFilterChips({ selected, onChange }: Props) {
  const { data: chips } = useQuery(filterChipsQueryOptions(selected));

  const chipByKey = new Map((chips ?? []).map((chip) => [chip.key, chip]));

  const remove = (key: string) =>
    onChange(selected.filter((token) => filterTokenKey(token) !== key));

  if (!selected.length) return null;
  return (
    <Flex gap="1" wrap="wrap">
      {selected.map((token) => {
        const key = filterTokenKey(token);
        // Undefined before resolved via query.
        const chip = chipByKey.get(key);
        const label = chip?.label;
        // Feature and state filters alike only match taxa that record it
        const assumedFeature =
          chip?.feature?.semantics === "assumed" ? chip.feature : null;

        return (
          <Badge
            key={key}
            className="taxon-state-filter-chip"
            data-assumed={assumedFeature ? true : undefined}
            color={label === null ? "tomato" : undefined}
          >
            {label === undefined ? (
              <Spinner size="1" />
            ) : assumedFeature ? (
              <ResponsiveTooltip
                content={assumedFeatureNote(assumedFeature.label)}
              >
                <Flex as="span" align="center" gap="1">
                  <Text color="tomato" asChild>
                    <PiExclamationMark />
                  </Text>
                  {label}
                </Flex>
              </ResponsiveTooltip>
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
