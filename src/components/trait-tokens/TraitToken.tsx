import { Flex, Text, Tooltip } from "@radix-ui/themes";
import { memo } from "react";
import { ColorBubble } from "./ColorBubble";
import { UITrait } from "./types";

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
    trait: UITrait;
    index?: number;
    isLast?: boolean;
  }) => {
    const text = formatTraitLabel(trait.label, index);

    const textComponent = trait.description ? (
      <Tooltip content={trait.description}>
        <span className="has-description">{text}</span>
      </Tooltip>
    ) : (
      text
    );

    return (
      <Flex
        display="inline-flex"
        className="trait-token"
        align="center"
        gap="1"
      >
        {trait.hexCode && <ColorBubble size={8} hexColor={trait.hexCode} />}
        <Text weight={trait.weight}>
          {textComponent}
          {!isLast && ","}
        </Text>
      </Flex>
    );
  },
);
