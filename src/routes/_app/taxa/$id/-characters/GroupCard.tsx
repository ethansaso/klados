import { Card, DataList, Heading, Separator } from "@radix-ui/themes";
import { TraitTokenList } from "../../../../../components/trait-tokens/TraitTokenList";
import { TaxonCharacterDisplayGroupDTO } from "../../../../../lib/domain/character-states/types";

export const GroupCard = ({
  group,
}: {
  group: TaxonCharacterDisplayGroupDTO;
}) => {
  return (
    <Card size="2">
      <Heading size="2">{group.label}</Heading>
      <Separator size="4" mt="1" mb="3" />
      <DataList.Root size="2">
        {group.characters.map((character) => (
          <DataList.Item key={character.id}>
            <DataList.Label>{character.label}</DataList.Label>
            <DataList.Value>
              {character.state && (
                <TraitTokenList traits={character.state.traitValues} />
              )}
            </DataList.Value>
          </DataList.Item>
        ))}
      </DataList.Root>
    </Card>
  );
};
