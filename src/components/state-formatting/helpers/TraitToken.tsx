import { Flex, Text, Tooltip } from "@radix-ui/themes";
import { memo } from "react";
import { formatModifierValue, formatTraitLabel } from "../formatting";
import type { UITrait } from "../types";
import { ColorBubble } from "./ColorBubble";

export const TraitToken = memo(
  ({
    trait,
    index = 0,
    isLast = false,
    highlightAffixes = false,
  }: {
    trait: UITrait;
    index?: number;
    isLast?: boolean;
    highlightAffixes?: boolean;
  }) => {
    const prefixes = highlightAffixes
      ? (trait.modifiers ?? []).filter((m) => m.affixType === "prefix")
      : [];
    const suffixes = highlightAffixes
      ? (trait.modifiers ?? []).filter((m) => m.affixType === "suffix")
      : [];

    const text = formatTraitLabel(trait.label, index, prefixes.length > 0);

    const labelNode = trait.description ? (
      <Tooltip content={trait.description}>
        <span className="has-information">{text}</span>
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
        wrap="wrap"
      >
        {trait.hexCode && <ColorBubble size={8} hexColor={trait.hexCode} />}
        {prefixes.map((m, i) => (
          <Text key={m.id} size="1" color="crimson">
            {formatModifierValue(m.value, i === 0)}
          </Text>
        ))}
        <Text weight={trait.weight}>
          {labelNode}
          {!isLast && ","}
        </Text>
        {suffixes.map((m) => (
          <Text key={m.id} size="1" color="cyan">
            {formatModifierValue(m.value)}
          </Text>
        ))}
      </Flex>
    );
  },
);
