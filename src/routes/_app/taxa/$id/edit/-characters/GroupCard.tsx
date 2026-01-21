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
import { memo, useCallback, useMemo, useState } from "react";
import { useFormContext } from "react-hook-form";
import { PiCheck, PiTrash, PiX } from "react-icons/pi";
import { TaxonEditFormValues } from "..";
import { CategoricalValueSuggestion } from "../../../../../../lib/api/character-suggestions/types";
import { characterGroupQueryOptions } from "../../../../../../lib/queries/characterGroups";
import { CharacterStateRow } from "./CharacterStateRow";
import { GroupStateSearch } from "./search/GroupStateSearch";
import { addStateFromSuggestion } from "./stateUtils";
import { CharacterStateFormValue } from "./validation";

type GroupCardProps = {
  groupId: number;
  statesForGroup: CharacterStateFormValue[];
  onChange: (next: CharacterStateFormValue[]) => void;
  onDelete: (groupId: number, characterIds: number[]) => void;
  onRemoveCategoricalValue: (characterId: number, traitValueId: number) => void;
  onRemoveState: (characterId: number) => void;
};

export const GroupCard = memo(
  ({
    groupId,
    statesForGroup,
    onChange,
    onDelete,
    onRemoveCategoricalValue,
    onRemoveState,
  }: GroupCardProps) => {
    const { getValues } = useFormContext<TaxonEditFormValues>();
    const [confirmingDelete, setConfirmingDelete] = useState(false);
    const { data, isLoading, isError } = useQuery(
      characterGroupQueryOptions(groupId),
    );

    const label = data?.label;

    // Build a map from statesForGroup for efficient lookup
    const stateByCharacterId = useMemo(() => {
      const map = new Map<number, CharacterStateFormValue>();
      for (const state of statesForGroup) {
        map.set(state.characterId, state);
      }
      return map;
    }, [statesForGroup]);

    const handleSuggestionSelect = useCallback(
      (s: CategoricalValueSuggestion) => {
        const current = getValues("characters");
        const next = addStateFromSuggestion(current, s);
        if (next !== current) {
          onChange(next);
        }
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

        {/* Add states via search */}
        <Box mt="2" mb="3">
          <GroupStateSearch
            groupId={groupId}
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
                state={stateByCharacterId.get(c.id)}
                onRemoveCategoricalValue={onRemoveCategoricalValue}
                onRemoveState={onRemoveState}
              />
            ))}
          </DataList.Root>
        )}
      </Card>
    );
  },
);
