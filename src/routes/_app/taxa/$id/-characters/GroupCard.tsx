import { Card, DataList, Flex, Heading } from "@radix-ui/themes";
import { TaxonCharacterDisplayGroupDTO } from "../../../../../lib/domain/character-states/types";
import { TraitToken } from "./TraitToken";

export const GroupCard = ({
  group,
}: {
  group: TaxonCharacterDisplayGroupDTO;
}) => {
  return (
    <Card size="2">
      <Heading size="4" mb="3">
        {group.label}
      </Heading>
      <DataList.Root size="2">
        {group.characters.map((character) => (
          <DataList.Item key={character.id}>
            <DataList.Label>{character.label}</DataList.Label>
            <DataList.Value>
              <Flex wrap="wrap" gap="1">
                {character.state?.traitValues.map((trait, index, arr) => (
                  <TraitToken
                    key={trait.id}
                    trait={trait}
                    index={index}
                    isLast={index === arr.length - 1}
                  />
                ))}
              </Flex>
            </DataList.Value>
          </DataList.Item>
        ))}
      </DataList.Root>
    </Card>
  );
};
