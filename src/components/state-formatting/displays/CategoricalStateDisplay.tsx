import { Flex } from "@radix-ui/themes";
import { memo } from "react";
import { TraitToken } from "../helpers/TraitToken";
import type { UICategoricalState } from "../types";

type Props = {
  state: UICategoricalState;
  highlightAffixes?: boolean;
};

export const CategoricalStateDisplay = memo(
  ({ state, highlightAffixes }: Props) => (
    <Flex wrap="wrap" gap="1">
      {state.traitValues.map((trait, index, arr) => (
        <TraitToken
          key={trait.id}
          trait={trait}
          index={index}
          isLast={index === arr.length - 1}
          highlightAffixes={highlightAffixes}
        />
      ))}
    </Flex>
  ),
);
