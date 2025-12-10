import {
  Box,
  Card,
  DataList,
  Flex,
  Heading,
  IconButton,
  Text,
} from "@radix-ui/themes";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { PiCheck, PiTrash, PiX } from "react-icons/pi";
import { CategoricalValueSuggestion } from "../../../../../../lib/api/character-suggestions/types";
import { characterGroupQueryOptions } from "../../../../../../lib/queries/characterGroups";
import { CharacterStateRow } from "./CharacterStateRow";
import { GroupTraitSearch } from "./GroupTraitSearch";
import { addCategoricalStateFromSuggestion } from "./stateUtils";
import { CharacterStateFormValue } from "./validation";

type GroupCardProps = {
  groupId: number;
  value: CharacterStateFormValue[];
  stateByCharacterId: Map<number, CharacterStateFormValue[]>;
  onChange: (next: CharacterStateFormValue[]) => void;
  onDelete: (groupId: number, characterIds: number[]) => void;
};

export function GroupCard({
  groupId,
  value,
  stateByCharacterId,
  onChange,
  onDelete,
}: GroupCardProps) {
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const { data, isLoading, isError } = useQuery(
    characterGroupQueryOptions(groupId)
  );

  const label = data?.label;

  const handleSuggestionSelect = (s: CategoricalValueSuggestion) => {
    const next = addCategoricalStateFromSuggestion(value, s);
    if (next !== value) {
      onChange(next);
    }
  };

  // TODO: Immediately delete if no characters exist in group
  const handleTrashClick = () => {
    setConfirmingDelete(true);
  };

  return (
    <Card mt="3">
      <Flex mb="2" align="center" justify="between">
        <Heading size="2" weight="bold">
          {label}
        </Heading>
        {confirmingDelete ? (
          <Flex mr="1" gap="2">
            <IconButton
              type="button"
              size="1"
              variant="ghost"
              color="tomato"
              onClick={() =>
                onDelete(groupId, data?.characters.map((c) => c.id) ?? [])
              }
            >
              <PiCheck size={12} />
            </IconButton>
            <IconButton
              type="button"
              size="1"
              variant="ghost"
              color="gray"
              onClick={() => setConfirmingDelete(false)}
            >
              <PiX size={12} />
            </IconButton>
          </Flex>
        ) : (
          <IconButton
            type="button"
            size="1"
            variant="ghost"
            color="tomato"
            mr="1"
            onClick={handleTrashClick}
          >
            <PiTrash size={12} />
          </IconButton>
        )}
      </Flex>

      {/* Add categorical (and later numeric) states via search */}
      <Box mt="2" mb="3">
        <GroupTraitSearch groupId={groupId} onSelect={handleSuggestionSelect} />
      </Box>

      {isLoading && <Text size="1">Loading characters…</Text>}
      {isError && (
        <Text size="1" color="red">
          Failed to load group.
        </Text>
      )}

      {data && (
        <DataList.Root size="1">
          {data.characters.map((c) => {
            const statesForChar = stateByCharacterId.get(c.id) ?? [];

            return (
              <CharacterStateRow
                key={c.id}
                character={c}
                states={statesForChar}
                allStates={value}
                onChangeAllStates={onChange}
              />
            );
          })}
        </DataList.Root>
      )}
    </Card>
  );
}
