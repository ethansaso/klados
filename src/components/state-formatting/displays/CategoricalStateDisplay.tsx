import { Text } from "@radix-ui/themes";
import { memo } from "react";
import { ResponsiveTooltip } from "../../ResponsiveTooltip";
import { formatTraitLabel } from "../formatting";
import { AffixedValue } from "../helpers/AffixedValue";
import type { UICategoricalState } from "../types";

type Props = {
  state: UICategoricalState;
  isLast?: boolean;
  highlightAffixes?: boolean;
  lowercaseFirst?: boolean;
};

export const CategoricalStateDisplay = memo(
  ({ state, isLast = true, highlightAffixes, lowercaseFirst }: Props) => {
    const { trait, modifiers } = state;
    const hasPrefixes = modifiers.some((m) => m.affixType === "prefix");
    const rawLabel = formatTraitLabel(
      trait.label,
      lowercaseFirst ? 1 : 0,
      hasPrefixes,
    );

    const label = trait.description ? (
      <ResponsiveTooltip content={trait.description}>
        <span className="has-information">{rawLabel}</span>
      </ResponsiveTooltip>
    ) : (
      rawLabel
    );

    return (
      <AffixedValue
        modifiers={modifiers}
        weight={trait.weight}
        isLast={isLast}
        highlightAffixes={highlightAffixes}
        lowercaseFirst={lowercaseFirst}
        hexCode={trait.hexCode}
      >
        <Text as="span" weight={trait.weight}>
          {label}
        </Text>
      </AffixedValue>
    );
  },
);
