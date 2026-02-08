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
import { memo, useCallback, useState } from "react";
import { useFormContext } from "react-hook-form";
import { PiCheck, PiTrash, PiX } from "react-icons/pi";
import type { TaxonEditFormValues } from "..";
import type { TraitSuggestion } from "../../../../../../lib/api/character-suggestions/types";
import { characterGroupQueryOptions } from "../../../../../../lib/queries/characterGroups";
import { CharacterStateRow } from "./CharacterStateRow";
import { GroupStateSearch } from "./search/GroupStateSearch";
import { addStateFromSuggestion } from "./stateUtils";
import type { CharacterGroupFormValue } from "./validation";

type GroupCardProps = {
  group: CharacterGroupFormValue;
  onChange: (nextGroups: CharacterGroupFormValue[]) => void;
  onDelete: () => void;
  onRemoveCategoricalValue: (
    groupId: number,
    characterId: number,
    traitValueId: number,
  ) => void;
  onRemoveState: (groupId: number, characterId: number) => void;
};

export const EditingGroupCard = memo(
  ({
    group,
    onChange,
    onDelete,
    onRemoveCategoricalValue,
    onRemoveState,
  }: GroupCardProps) => {
    const { getValues } = useFormContext<TaxonEditFormValues>();
    const [confirmingDelete, setConfirmingDelete] = useState(false);
    const { data, isLoading, isError } = useQuery(
      characterGroupQueryOptions(group.groupId),
    );

    const label = data?.label;

    const handleSuggestionSelect = useCallback(
      (s: TraitSuggestion) => {
        const prev = getValues("states");
        const next = addStateFromSuggestion(prev, s);
        onChange(next);
      },
      [getValues, onChange],
    );

    // TODO: Immediately delete if no characters exist in group
    const handleTrashClick = () => {
      setConfirmingDelete(true);
    };

    return (
      <Card>
        <Flex mb="2" align="center" justify="between">
          <Heading size="2" weight="medium">
            {label}
          </Heading>
          {confirmingDelete ? (
            <Flex mr="1" gap="2">
              <IconButton
                type="button"
                size="1"
                variant="ghost"
                color="tomato"
                onClick={() => onDelete()}
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

        {/* Add states via search */}
        <Box mt="2" mb="3">
          <GroupStateSearch
            groupId={group.groupId}
            onSelect={handleSuggestionSelect}
          />
        </Box>

        {isLoading && <Text size="1">Loading characters…</Text>}
        {isError && (
          <Text size="1" color="red">
            Failed to load group.
          </Text>
        )}

        {data && (
          <DataList.Root size="1">
            {data.characters.map((c) => (
              <CharacterStateRow
                key={c.id}
                character={c}
                state={group.characters.find((s) => s.characterId === c.id)}
                onRemoveCategoricalValue={(characterId, traitValueId) =>
                  onRemoveCategoricalValue(
                    group.groupId,
                    characterId,
                    traitValueId,
                  )
                }
                onRemoveState={(characterId) =>
                  onRemoveState(group.groupId, characterId)
                }
              />
            ))}
          </DataList.Root>
        )}
      </Card>
    );
  },
);
