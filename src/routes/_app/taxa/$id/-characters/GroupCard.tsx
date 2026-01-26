import { Card, DataList, Heading, Separator, Tooltip } from "@radix-ui/themes";
import { CharacterStateDisplay } from "../../../../../components/trait-tokens/CharacterStateDisplay";
import type { GroupedCharacterStates } from "../../../../../lib/domain/character-states/utils";

export const GroupCard = ({ group }: { group: GroupedCharacterStates }) => {
  const cardHeaderComponent = group.groupDescription ? (
    <Tooltip content={group.groupDescription}>
      <span className="has-information">{group.groupLabel}</span>
    </Tooltip>
  ) : (
    group.groupLabel
  );

  return (
    <Card size="2">
      <Heading size="2">{cardHeaderComponent}</Heading>
      <Separator size="4" mt="1" mb="3" />
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
    </Card>
  );
};
