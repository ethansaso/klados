import { Strong, Text } from "@radix-ui/themes";
import { Fragment } from "react";
import { GlossaryCharacterCard } from "../../../../../components/glossary-cards/GlossaryCharacterCard";
import { GlossaryFeatureCard } from "../../../../../components/glossary-cards/GlossaryFeatureCard";
import { CharacterStateDisplay } from "../../../../../components/state-formatting/CharacterStateDisplay";
import type {
  CharacterStateDTO,
  FeatureStateDTO,
} from "../../../../../lib/domain/states/types";

export const FeatureRenderer = ({ feature }: { feature: FeatureStateDTO }) => {
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
      kind: "categorical" | "number" | "range";
      states: CharacterStateDTO[];
    }
  >();
  for (const state of feature.states) {
    let group = characterGroups.get(state.characterId);
    if (!group) {
      group = {
        label: state.characterLabel,
        hasInfo: state.characterHasInfo,
        kind: state.kind,
        states: [],
      };
      characterGroups.set(state.characterId, group);
    }
    group.states.push(state);
  }
  const entries = Array.from(characterGroups.entries());

  return (
    <>
      <Text>
        <Strong>{cardHeaderComponent} </Strong>
      </Text>
      {entries.length > 0 ? (
        entries.map(([characterId, { label, hasInfo, states, kind }], idx) => {
          const dlLabel = hasInfo ? (
            <GlossaryCharacterCard id={characterId}>
              <span className="has-information">{label.toLowerCase()}</span>
            </GlossaryCharacterCard>
          ) : (
            label.toLowerCase()
          );

          return (
            <Fragment key={characterId}>
              {kind !== "categorical" && <>{dlLabel} </>}
              <CharacterStateDisplay states={states} forceLowercase />
              {idx < entries.length - 1 ? "; " : ""}
            </Fragment>
          );
        })
      ) : (
        <Text>present</Text>
      )}
      .{" "}
    </>
  );
};
