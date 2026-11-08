import { Text } from "@radix-ui/themes";
import { memo, type ReactNode } from "react";
import { ModifierDisplay } from "../displays/ModifierDisplay";
import { formatModifierLabel } from "../formatting";
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

const JOINER_TEXT: Record<UIModifier["joiner"], string> = {
  space: " ",
  slash: "/",
  comma: ", ",
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
        {prefixes.map((m, i) => (
          <Text
            key={m.id}
            as="span"
            weight={weight}
            color={highlightAffixes ? "crimson" : undefined}
          >
            {i > 0 && JOINER_TEXT[m.joiner]}
            {/* Keeps the swatch from wrapping apart from the first prefix. */}
            <span
              style={i === 0 && swatch ? { whiteSpace: "nowrap" } : undefined}
            >
              {i === 0 && swatch}
              <ModifierDisplay
                modifier={m}
                text={formatModifierLabel(m.label, !lowercaseFirst && i === 0)}
              />
            </span>
          </Text>
        ))}
        {prefixes.length > 0 && " "}
        <Text as="span" weight={weight}>
          <span style={{ whiteSpace: "nowrap" }}>
            {prefixes.length === 0 && swatch}
            {children}
          </span>
          {!isLast && suffixes.length === 0 && ","}
        </Text>
        {suffixes.map((m, i) => (
          <Text
            key={m.id}
            as="span"
            weight={weight}
            color={highlightAffixes ? "cyan" : undefined}
          >
            {JOINER_TEXT[m.joiner]}
            <ModifierDisplay modifier={m} text={formatModifierLabel(m.label)} />
            {!isLast && i === suffixes.length - 1 && ","}
          </Text>
        ))}
      </Text>
    );
  },
);
