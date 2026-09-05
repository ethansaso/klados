import { GlossaryModifierCard } from "../../glossary-cards/GlossaryModifierCard";
import type { UIModifier } from "../types";

export const ModifierDisplay = ({
  modifier,
  text,
}: {
  modifier: UIModifier;
  text: string;
}) =>
  modifier.hasInfo ? (
    <GlossaryModifierCard id={modifier.id}>
      <span className="has-information">{text}</span>
    </GlossaryModifierCard>
  ) : (
    <>{text}</>
  );
