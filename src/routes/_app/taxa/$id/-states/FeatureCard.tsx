import { Card, DataList, Heading, Separator, Text } from "@radix-ui/themes";
import { GlossaryCharacterCard } from "../../../../../components/glossary-cards/GlossaryCharacterCard";
import { GlossaryFeatureCard } from "../../../../../components/glossary-cards/GlossaryFeatureCard";
import { CharacterStateDisplay } from "../../../../../components/state-formatting/CharacterStateDisplay";
import type {
  CharacterStateDTO,
  FeatureStateDTO,
} from "../../../../../lib/domain/states/types";

export const FeatureCard = ({ feature }: { feature: FeatureStateDTO }) => {
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
    { label: string; hasInfo: boolean; states: CharacterStateDTO[] }
  >();
  for (const state of feature.states) {
    let group = characterGroups.get(state.characterId);
    if (!group) {
      group = {
        label: state.characterLabel,
        hasInfo: state.characterHasInfo,
        states: [],
      };
      characterGroups.set(state.characterId, group);
    }
    group.states.push(state);
  }

  return (
    <Card size="2">
      <Heading size="2">{cardHeaderComponent}</Heading>
      <Separator size="4" mt="1" mb="3" />
      {characterGroups.size > 0 ? (
        <DataList.Root size={{ initial: "1", sm: "2" }}>
          {Array.from(characterGroups.entries()).map(
            ([characterId, { label, hasInfo, states }]) => {
              const dlLabel = hasInfo ? (
                <GlossaryCharacterCard id={characterId}>
                  <span className="has-information">{label}</span>
                </GlossaryCharacterCard>
              ) : (
                label
              );

              return (
                <DataList.Item key={characterId}>
                  <DataList.Label>{dlLabel}</DataList.Label>
                  <DataList.Value>
                    <CharacterStateDisplay states={states} />
                  </DataList.Value>
                </DataList.Item>
              );
            },
          )}
        </DataList.Root>
      ) : (
        <Text color="gray" size="2">
          No character states assigned.
        </Text>
      )}
    </Card>
  );
};
