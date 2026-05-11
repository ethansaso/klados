import { Text } from "@radix-ui/themes";
import { memo, type ReactNode } from "react";
import { formatModifierValue, groupConsecutive } from "../formatting";
import type { UIModifier } from "../types";
import { ColorBubble } from "./ColorBubble";

type Weight = "light" | "regular" | "medium" | "bold";

type Props = {
  modifiers: UIModifier[];
  weight?: Weight;
  highlightAffixes?: boolean;
  /** When false, appends a trailing comma after the last rendered element. */
  isLast?: boolean;
  /** When true, suppresses capitalization of the first rendered character (prefix or label). */
  lowercaseFirst?: boolean;
  /** When provided, renders a color swatch before all other content (including prefix modifiers). */
  hexCode?: string | null;
  children: ReactNode;
};

export const AffixedValue = memo(
  ({
    modifiers,
    weight,
    highlightAffixes,
    isLast = true,
    lowercaseFirst,
    hexCode,
    children,
  }: Props) => {
    const prefixes = modifiers.filter((m) => m.affixType === "prefix");
    const suffixes = modifiers.filter((m) => m.affixType === "suffix");
    const prefixGroups = groupConsecutive(prefixes);
    const suffixGroups = groupConsecutive(suffixes);

    if (modifiers.length === 0) {
      return (
        <Text as="span" weight={weight}>
          {hexCode && <ColorBubble size={8} hexColor={hexCode} />}
          {hexCode && " "}
          {children}
          {!isLast && ","}
        </Text>
      );
    }

    return (
      <Text as="span" weight={weight}>
        {hexCode && <ColorBubble size={8} hexColor={hexCode} />}
        {hexCode && " "}
        {prefixGroups.map((group, gi) => (
          <Text
            key={group[0]!.id}
            as="span"
            weight={weight}
            color={highlightAffixes ? "crimson" : undefined}
          >
            {group
              .map((m, mi) =>
                formatModifierValue(
                  m.value,
                  !lowercaseFirst && gi === 0 && mi === 0,
                ),
              )
              .join("/")}{" "}
          </Text>
        ))}
        <Text as="span" weight={weight}>
          {children}
          {!isLast && suffixGroups.length === 0 && ","}
        </Text>
        {suffixGroups.map((group, gi) => (
          <Text
            key={group[0]!.id}
            as="span"
            weight={weight}
            color={highlightAffixes ? "cyan" : undefined}
          >
            {" "}
            {group.map((m) => formatModifierValue(m.value)).join("/")}
            {!isLast && gi === suffixGroups.length - 1 && ","}
          </Text>
        ))}
      </Text>
    );
  },
);
