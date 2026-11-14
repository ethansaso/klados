import { memo } from "react";
import { formatNumericCopy } from "../formatting";
import { AffixedValue } from "../helpers/AffixedValue";
import type { UINumberState, UIRangeState } from "../types";

type Props = {
  state: UINumberState | UIRangeState;
  isLast?: boolean;
  highlightAffixes?: boolean;
  lowercaseFirst?: boolean;
  hideModifiers?: boolean;
};

export const NumericStateDisplay = memo(
  ({
    state,
    isLast = true,
    highlightAffixes,
    lowercaseFirst,
    hideModifiers,
  }: Props) => {
    const copy = formatNumericCopy(state);

    if (hideModifiers) {
      return copy;
    }

    return (
      <AffixedValue
        modifiers={state.modifiers ?? []}
        weight={state.weight}
        isLast={isLast}
        highlightAffixes={highlightAffixes}
        lowercaseFirst={lowercaseFirst}
      >
        {copy}
      </AffixedValue>
    );
  },
);
