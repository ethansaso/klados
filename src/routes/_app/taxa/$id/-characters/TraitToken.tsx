import { Flex, Text } from "@radix-ui/themes";
import { memo } from "react";
import { Trait } from "../../../../../lib/domain/character-states/types";

export const TraitToken = memo(({ trait }: { trait: Trait }) => {
  return (
    <Flex display="inline-flex" className="trait-token" align="center" gap="1">
      {trait.hexCode && (
        <span
          className="trait-color-indicator"
          style={{ backgroundColor: trait.hexCode }}
        />
      )}
      <Text size="1">{trait.label}</Text>
    </Flex>
  );
});
