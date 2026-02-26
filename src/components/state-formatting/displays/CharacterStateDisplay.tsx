import { memo } from "react";
import { CategoricalStateDisplay } from "../CategoricalStateDisplay";
import type { UICharacterState } from "../types";
import { NumericStateDisplay } from "./NumericStateDisplay";

type Props = {
  state: UICharacterState;
  /**
   * When true, prefix modifiers are rendered in crimson and suffix modifiers
   * in cyan.
   */
  highlightAffixes?: boolean;
};

export const CharacterStateDisplay = memo(
  ({ state, highlightAffixes }: Props) => {
    switch (state.kind) {
      case "categorical":
        return (
          <CategoricalStateDisplay
            state={state}
            highlightAffixes={highlightAffixes}
          />
        );
      case "number":
      case "range":
        return (
          <NumericStateDisplay
            state={state}
            highlightAffixes={highlightAffixes}
          />
        );
    }
  },
);
