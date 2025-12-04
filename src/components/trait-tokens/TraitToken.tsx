import { Flex, Text } from "@radix-ui/themes";
import { memo } from "react";
import { Trait } from "../../lib/domain/character-states/types";
import { ColorBubble } from "./ColorBubble";

function formatTraitLabel(label: string, index: number) {
  const lower = label.toLowerCase();
  if (index === 0) {
    // Only the first token: capitalize first letter
    return lower[0].toUpperCase() + lower.slice(1);
  }
  return lower;
}

export const TraitToken = memo(
  ({
    trait,
    index = 0,
    isLast = false,
  }: {
    trait: Trait;
    index?: number;
    isLast?: boolean;
  }) => {
    const text = formatTraitLabel(trait.label, index);

    return (
      <Flex
        display="inline-flex"
        className="trait-token"
        align="center"
        gap="1"
      >
        {trait.hexCode && <ColorBubble size={8} hexColor={trait.hexCode} />}
        <Text>
          {text}
          {!isLast && ","}
        </Text>
      </Flex>
    );
  }
);
