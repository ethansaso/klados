import { Flex } from "@radix-ui/themes";
import { memo } from "react";
import { TraitToken } from "./TraitToken";
import { UITokenTrait } from "./types";

export const TraitTokenList = memo(({ traits }: { traits: UITokenTrait[] }) => {
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
