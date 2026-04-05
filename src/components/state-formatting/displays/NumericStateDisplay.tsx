import { Flex, Text } from "@radix-ui/themes";
import { memo } from "react";
import { convertFromSI } from "../../../lib/domain/units/conversion";
import { formatModifierValue, formatWithUnit } from "../formatting";
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

    if (modifiers.length > 0) {
      return (
        <Flex display="inline-flex" align="center" gap="1" wrap="wrap">
          {prefixes.map((m, i) => (
            <Text
              key={m.id}
              size="1"
              color={highlightAffixes ? "crimson" : undefined}
            >
              {formatModifierValue(m.value, i === 0)}
            </Text>
          ))}
          <Text weight={state.weight}>{copy}</Text>
          {suffixes.map((m) => (
            <Text
              key={m.id}
              size="1"
              color={highlightAffixes ? "cyan" : undefined}
            >
              {formatModifierValue(m.value)}
            </Text>
          ))}
        </Flex>
      );
    }

    return <Text weight={state.weight}>{copy}</Text>;
  },
);
