import { Flex } from "@radix-ui/themes";
import { memo } from "react";
import { Trait } from "../../lib/domain/character-states/types";
import { TraitToken } from "./TraitToken";

export const TraitTokenList = memo(({ traits }: { traits: Trait[] }) => {
  return (
    <Flex wrap="wrap" gap="1">
      {traits.map((trait, index, arr) => (
        <TraitToken
          key={trait.id}
          trait={trait}
          index={index}
          isLast={index === arr.length - 1}
        />
      ))}
    </Flex>
  );
});
