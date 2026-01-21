import { Card, DataList, Heading, Separator } from "@radix-ui/themes";
import { CharacterStateDisplay } from "../../../../../components/trait-tokens/CharacterStateDisplay";
import { GroupedCharacterStates } from "../../../../../lib/domain/character-states/utils";

export const GroupCard = ({ group }: { group: GroupedCharacterStates }) => {
  return (
    <Card size="2">
      <Heading size="2">{group.groupLabel}</Heading>
      <Separator size="4" mt="1" mb="3" />
      <DataList.Root size="2">
        {group.states.map((state) => (
          <DataList.Item key={state.characterId}>
            <DataList.Label>{state.characterLabel}</DataList.Label>
            <DataList.Value>
              <CharacterStateDisplay state={state} />
            </DataList.Value>
          </DataList.Item>
        ))}
      </DataList.Root>
    </Card>
  );
};
