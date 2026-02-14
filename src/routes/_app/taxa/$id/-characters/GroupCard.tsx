import {
  Card,
  DataList,
  Heading,
  Separator,
  Text,
  Tooltip,
} from "@radix-ui/themes";
import { CharacterStateDisplay } from "../../../../../components/trait-tokens/CharacterStateDisplay";
import type { TaxonCharacterFeatureStateDTO } from "../../../../../lib/domain/states/types";

export const GroupCard = ({
  group,
}: {
  group: TaxonCharacterFeatureStateDTO;
}) => {
  const cardHeaderComponent = group.featureDescription ? (
    <Tooltip content={group.featureDescription}>
      <span className="has-information">{group.featureLabel}</span>
    </Tooltip>
  ) : (
    group.featureLabel
  );

  return (
    <Card size="2">
      <Heading size="2">{cardHeaderComponent}</Heading>
      <Separator size="4" mt="1" mb="3" />
      {group.states.length > 0 ? (
        <DataList.Root size={{ initial: "1", sm: "2" }}>
          {group.states.map((state) => {
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
