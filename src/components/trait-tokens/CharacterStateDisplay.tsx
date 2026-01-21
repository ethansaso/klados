import { Flex, Text } from "@radix-ui/themes";
import { memo } from "react";
import { convertFromSI } from "../../lib/domain/units/conversion";
import { TraitToken } from "./TraitToken";
import { UICharacterState, UIUnit } from "./types";

type Props = {
  state: UICharacterState;
};

function formatWithUnit(value: number | string, unit: UIUnit | null) {
  return unit ? `${value} ${unit.symbol}` : value;
}

export const CharacterStateDisplay = memo(({ state }: Props) => {
  switch (state.kind) {
    case "categorical":
      return (
        <Flex wrap="wrap" gap="1">
          {state.traitValues.map((trait, index, arr) => (
            <TraitToken
              key={trait.id}
              trait={trait}
              index={index}
              isLast={index === arr.length - 1}
            />
          ))}
        </Flex>
      );

    case "number": {
      const value = convertFromSI(state.siBaseValue, state.unit?.scale);
      const copy = formatWithUnit(value, state.unit);

      return <Text weight={state.weight}>{copy}</Text>;
    }

    case "range": {
      const min = convertFromSI(state.siBaseMin, state.unit?.scale);
      const max = convertFromSI(state.siBaseMax, state.unit?.scale);
      const copy = formatWithUnit(`${min}–${max}`, state.unit);

      return <Text weight={state.weight}>{copy}</Text>;
    }
  }
});
