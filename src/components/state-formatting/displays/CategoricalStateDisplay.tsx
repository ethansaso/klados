import { Flex } from "@radix-ui/themes";
import { memo } from "react";
import { TraitToken } from "../helpers/TraitToken";
import type { UICategoricalState } from "../types";

type Props = {
  state: UICategoricalState;
  highlightAffixes?: boolean;
};

export const CategoricalStateDisplay = memo(
  ({ state, highlightAffixes }: Props) => {
    const sorted = [...state.traitValues].sort(
      (a, b) => (a.modifiers?.length ?? 0) - (b.modifiers?.length ?? 0),
    );
    return (
      <Flex wrap="wrap" gapX="1">
        {sorted.map((trait, index, arr) => (
          <TraitToken
            key={trait.id}
            trait={trait}
            index={index}
            isLast={index === arr.length - 1}
            highlightAffixes={highlightAffixes}
          />
        ))}
      </Flex>
    );
  },
);
