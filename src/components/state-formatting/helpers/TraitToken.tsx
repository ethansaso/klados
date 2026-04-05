import { Flex, Text } from "@radix-ui/themes";
import { memo } from "react";
import { ResponsiveTooltip } from "../../ResponsiveTooltip";
import {
  formatModifierValue,
  formatTraitLabel,
  groupConsecutive,
} from "../formatting";
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
    const prefixGroups = groupConsecutive(prefixes);
    const suffixGroups = groupConsecutive(suffixes);

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
        gapX="1"
        wrap="wrap"
      >
        {trait.hexCode && <ColorBubble size={8} hexColor={trait.hexCode} />}
        {prefixGroups.map((group, gi) => (
          <Text
            key={group[0]!.id}
            weight={trait.weight}
            color={highlightAffixes ? "crimson" : undefined}
          >
            {group
              .map((m, mi) =>
                formatModifierValue(m.value, gi === 0 && mi === 0),
              )
              .join("/")}
          </Text>
        ))}
        <Text weight={trait.weight}>
          {labelNode}
          {!isLast && suffixGroups.length === 0 && ","}
        </Text>
        {suffixGroups.map((group, gi) => (
          <Text
            key={group[0]!.id}
            weight={trait.weight}
            color={highlightAffixes ? "cyan" : undefined}
          >
            {group.map((m) => formatModifierValue(m.value)).join("/")}
            {!isLast && gi === suffixGroups.length - 1 && ","}
          </Text>
        ))}
      </Flex>
    );
  },
);
