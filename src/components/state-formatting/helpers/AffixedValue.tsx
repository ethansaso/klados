import { Text } from "@radix-ui/themes";
import { Fragment, memo, type ReactNode } from "react";
import { ModifierDisplay } from "../displays/ModifierDisplay";
import { formatModifierLabel, groupConsecutive } from "../formatting";
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
  /** When provided, renders a color swatch before the prefixes and content. */
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
    const swatch = hexCode && (
      <span style={{ display: "inline-block", marginRight: 4 }}>
        <ColorBubble hexColor={hexCode} />
      </span>
    );

    if (modifiers.length === 0) {
      return (
        <Text as="span" weight={weight}>
          <span style={{ whiteSpace: "nowrap" }}>
            {swatch}
            {children}
          </span>
          {!isLast && ","}
        </Text>
      );
    }

    return (
      <Text as="span" weight={weight}>
        {prefixGroups.map((group, gi) => (
          <Text
            key={group[0]!.id}
            as="span"
            weight={weight}
            color={highlightAffixes ? "crimson" : undefined}
          >
            {/* Keeps the swatch from wrapping apart from the first prefix. */}
            <span
              style={gi === 0 && swatch ? { whiteSpace: "nowrap" } : undefined}
            >
              {gi === 0 && swatch}
              {group.map((m, mi) => (
                <Fragment key={m.id}>
                  {mi > 0 && "/"}
                  <ModifierDisplay
                    modifier={m}
                    text={formatModifierLabel(
                      m.label,
                      !lowercaseFirst && gi === 0 && mi === 0,
                    )}
                  />
                </Fragment>
              ))}
            </span>{" "}
          </Text>
        ))}
        <Text as="span" weight={weight}>
          <span style={{ whiteSpace: "nowrap" }}>
            {prefixGroups.length === 0 && swatch}
            {children}
          </span>
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
            {group.map((m, mi) => (
              <Fragment key={m.id}>
                {mi > 0 && "/"}
                <ModifierDisplay
                  modifier={m}
                  text={formatModifierLabel(m.label)}
                />
              </Fragment>
            ))}
            {!isLast && gi === suffixGroups.length - 1 && ","}
          </Text>
        ))}
      </Text>
    );
  },
);
