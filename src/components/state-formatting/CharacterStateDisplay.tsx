import { Text } from "@radix-ui/themes";
import { memo } from "react";
import { CategoricalStateDisplay } from "./displays/CategoricalStateDisplay";
import { NumericStateDisplay } from "./displays/NumericStateDisplay";
import type { UICharacterState } from "./types";

type Props = {
  states: UICharacterState[];
  /**
   * When true, prefix modifiers are rendered in crimson and suffix modifiers
   * in cyan.
   */
  highlightAffixes?: boolean;
  /**
   * When true, no uppercasing will be applied in formatting.
   */
  forceLowercase?: boolean;
};

function SingleStateDisplay({
  state,
  isLast,
  highlightAffixes,
  lowercaseFirst,
}: {
  state: UICharacterState;
  isLast: boolean;
  highlightAffixes?: boolean;
  lowercaseFirst?: boolean;
}) {
  switch (state.kind) {
    case "categorical":
      return (
        <CategoricalStateDisplay
          state={state}
          isLast={isLast}
          highlightAffixes={highlightAffixes}
          lowercaseFirst={lowercaseFirst}
        />
      );
    case "number":
    case "range":
      return (
        <NumericStateDisplay
          state={state}
          isLast={isLast}
          highlightAffixes={highlightAffixes}
        />
      );
  }
}

export const CharacterStateDisplay = memo(
  ({ states, highlightAffixes, forceLowercase }: Props) => {
    if (states.length === 1) {
      return (
        <SingleStateDisplay
          state={states[0]!}
          isLast
          highlightAffixes={highlightAffixes}
          lowercaseFirst={forceLowercase}
        />
      );
    }
    return (
      <Text as="span">
        {states.map((state, i) => (
          <Text as="span" key={i}>
            {i > 0 && " "}
            <SingleStateDisplay
              state={state}
              isLast={i === states.length - 1}
              highlightAffixes={highlightAffixes}
              lowercaseFirst={forceLowercase || i > 0}
            />
          </Text>
        ))}
      </Text>
    );
  },
);
