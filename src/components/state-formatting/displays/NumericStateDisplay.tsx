import { Flex, Text } from "@radix-ui/themes";
import { memo } from "react";
import { convertFromSI } from "../../../lib/domain/units/conversion";
import {
  formatModifierValue,
  formatWithUnit,
  groupConsecutive,
} from "../formatting";
import type { UINumberState, UIRangeState } from "../types";

type Props = {
  state: UINumberState | UIRangeState;
  highlightAffixes?: boolean;
};

function computeCopy(state: UINumberState | UIRangeState): string {
  if (state.kind === "number") {
    const value = convertFromSI(state.siBaseValue, state.unit?.scale);
    return formatWithUnit(value, state.unit);
  }
  const min =
    state.siBaseMin !== null
      ? convertFromSI(state.siBaseMin, state.unit?.scale)
      : null;
  const max =
    state.siBaseMax !== null
      ? convertFromSI(state.siBaseMax, state.unit?.scale)
      : null;
  const rangeStr =
    min !== null && max !== null
      ? `${min}–${max}`
      : min !== null
        ? `≥ ${min}`
        : `≤ ${max}`;
  return formatWithUnit(rangeStr, state.unit);
}

export const NumericStateDisplay = memo(
  ({ state, highlightAffixes }: Props) => {
    const copy = computeCopy(state);
    const modifiers = state.modifiers ?? [];
    const prefixes = modifiers.filter((m) => m.affixType === "prefix");
    const suffixes = modifiers.filter((m) => m.affixType === "suffix");
    const prefixGroups = groupConsecutive(prefixes);
    const suffixGroups = groupConsecutive(suffixes);

    if (modifiers.length > 0) {
      return (
        <Flex display="inline-flex" align="center" gap="1" wrap="wrap">
          {prefixGroups.map((group, gi) => (
            <Text
              key={group[0]!.id}
              size="1"
              weight={state.weight}
              color={highlightAffixes ? "crimson" : undefined}
            >
              {group
                .map((m, mi) =>
                  formatModifierValue(m.value, gi === 0 && mi === 0),
                )
                .join("/")}
            </Text>
          ))}
          <Text weight={state.weight}>{copy}</Text>
          {suffixGroups.map((group) => (
            <Text
              key={group[0]!.id}
              size="1"
              weight={state.weight}
              color={highlightAffixes ? "cyan" : undefined}
            >
              {group.map((m) => formatModifierValue(m.value)).join("/")}
            </Text>
          ))}
        </Flex>
      );
    }

    return <Text weight={state.weight}>{copy}</Text>;
  },
);
