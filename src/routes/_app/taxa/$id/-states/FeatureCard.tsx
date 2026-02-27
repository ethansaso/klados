import {
  Card,
  DataList,
  Heading,
  Separator,
  Text,
  Tooltip,
} from "@radix-ui/themes";
import { CharacterStateDisplay } from "../../../../../components/state-formatting/CharacterStateDisplay";
import type { FeatureStateDTO } from "../../../../../lib/domain/states/types";

export const FeatureCard = ({ feature }: { feature: FeatureStateDTO }) => {
  const cardHeaderComponent = feature.featureDescription ? (
    <Tooltip content={feature.featureDescription}>
      <span className="has-information">{feature.featureLabel}</span>
    </Tooltip>
  ) : (
    feature.featureLabel
  );

  return (
    <Card size="2">
      <Heading size="2">{cardHeaderComponent}</Heading>
      <Separator size="4" mt="1" mb="3" />
      {feature.states.length > 0 ? (
        <DataList.Root size={{ initial: "1", sm: "2" }}>
          {feature.states.map((state) => {
            const dlLabel = state.characterDescription ? (
              <Tooltip content={state.characterDescription}>
                <span className="has-information">{state.characterLabel}</span>
              </Tooltip>
            ) : (
              state.characterLabel
            );

            return (
              <DataList.Item key={state.characterId}>
                <DataList.Label>{dlLabel}</DataList.Label>
                <DataList.Value>
                  <CharacterStateDisplay state={state} />
                </DataList.Value>
              </DataList.Item>
            );
          })}
        </DataList.Root>
      ) : (
        <Text color="gray" size="2">
          No character states assigned.
        </Text>
      )}
    </Card>
  );
};
