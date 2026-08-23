import { Box, Strong, Text } from "@radix-ui/themes";
import { Fragment } from "react";
import { GlossaryCharacterCard } from "../../../../../components/glossary-cards/GlossaryCharacterCard";
import { GlossaryFeatureCard } from "../../../../../components/glossary-cards/GlossaryFeatureCard";
import { CharacterStateDisplay } from "../../../../../components/state-formatting/CharacterStateDisplay";
import type { FeaturePresence } from "../../../../../../db/schema/schema";
import type {
  CharacterStateDTO,
  FeatureStateDTO,
} from "../../../../../lib/domain/states/types";

const PRESENCE_LABELS: Record<FeaturePresence, string> = {
  present: "present",
  variable: "sometimes present",
  absent: "absent",
};

export const FeatureRenderer = ({
  feature,
  indentDescription,
}: {
  feature: FeatureStateDTO;
  indentDescription?: boolean;
}) => {
  const notes = feature.notes.trim();

  const cardHeaderComponent = feature.featureHasInfo ? (
    <GlossaryFeatureCard id={feature.featureId}>
      <span className="has-information">{feature.featureLabel}</span>
    </GlossaryFeatureCard>
  ) : (
    feature.featureLabel
  );

  // Group states by characterId, preserving order of first appearance.
  const characterGroups = new Map<
    number,
    {
      label: string;
      hasInfo: boolean;
      showInProse: boolean;
      states: CharacterStateDTO[];
    }
  >();
  for (const state of feature.states) {
    let group = characterGroups.get(state.characterId);
    if (!group) {
      group = {
        label: state.characterLabel,
        hasInfo: state.characterHasInfo,
        showInProse: state.showInProse,
        states: [],
      };
      characterGroups.set(state.characterId, group);
    }
    group.states.push(state);
  }
  const entries = Array.from(characterGroups.entries());
  const Wrapper = indentDescription ? Box : Fragment;

  return (
    <Wrapper>
      <Text>
        <Strong>{cardHeaderComponent} </Strong>
      </Text>
      {feature.presence === "variable" && entries.length > 0 && (
        <Text>when present, </Text>
      )}
      {entries.length > 0 ? (
        entries.map(
          ([characterId, { label, hasInfo, states, showInProse }], idx) => {
            const dlLabel = hasInfo ? (
              <GlossaryCharacterCard id={characterId}>
                <span className="has-information">{label.toLowerCase()}</span>
              </GlossaryCharacterCard>
            ) : (
              label.toLowerCase()
            );

            return (
              <Fragment key={characterId}>
                {showInProse && <>{dlLabel} </>}
                <CharacterStateDisplay states={states} forceLowercase />
                {idx < entries.length - 1 ? "; " : ""}
              </Fragment>
            );
          },
        )
      ) : (
        <Text>{PRESENCE_LABELS[feature.presence]}</Text>
      )}
      {notes.length > 0 && <>; {notes}</>}.{" "}
    </Wrapper>
  );
};
