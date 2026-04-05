import { Flex, Text } from "@radix-ui/themes";
import { memo } from "react";
import { ResponsiveTooltip } from "../../ResponsiveTooltip";
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
    const prefixes = (trait.modifiers ?? []).filter(
      (m) => m.affixType === "prefix",
    );
    const suffixes = (trait.modifiers ?? []).filter(
      (m) => m.affixType === "suffix",
    );

    const text = formatTraitLabel(trait.label, index, prefixes.length > 0);

    const labelNode = trait.description ? (
      <ResponsiveTooltip content={trait.description}>
        <span className="has-information">{text}</span>
      </ResponsiveTooltip>
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
          <Text key={m.id} color={highlightAffixes ? "crimson" : undefined}>
            {formatModifierValue(m.value, i === 0)}
          </Text>
        ))}
        <Text weight={trait.weight}>
          {labelNode}
          {!isLast && suffixes.length === 0 && ","}
        </Text>
        {suffixes.map((m, i) => (
          <Text key={m.id} color={highlightAffixes ? "cyan" : undefined}>
            {formatModifierValue(m.value)}
            {!isLast && i === suffixes.length - 1 && ","}
          </Text>
        ))}
      </Flex>
    );
  },
);
