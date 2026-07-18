import { memo } from "react";
import { convertFromSI } from "../../../lib/domain/units/conversion";
import { formatWithUnit } from "../formatting";
import { AffixedValue } from "../helpers/AffixedValue";
import type { UINumberState, UIRangeState } from "../types";

type Props = {
  state: UINumberState | UIRangeState;
  isLast?: boolean;
  highlightAffixes?: boolean;
  hideModifiers?: boolean;
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
  ({ state, isLast = true, highlightAffixes, hideModifiers }: Props) => {
    const copy = computeCopy(state);

    if (hideModifiers) {
      return copy;
    }

    return (
      <AffixedValue
        modifiers={state.modifiers ?? []}
        weight={state.weight}
        isLast={isLast}
        highlightAffixes={highlightAffixes}
      >
        {copy}
      </AffixedValue>
    );
  },
);
