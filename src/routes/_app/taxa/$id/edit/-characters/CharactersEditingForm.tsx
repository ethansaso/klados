import { Box } from "@radix-ui/themes";
import { useCallback, useMemo, useState } from "react";
import { useFormContext } from "react-hook-form";
import { TaxonEditFormValues } from "..";
import { FormDescriptor } from "../../../../../../components/FormDescriptor";
import { ComboboxOption } from "../../../../../../components/inputs/combobox/types";
import { EditingGroupCard } from "./EditingGroupCard";
import { GroupSearch } from "./search/GroupSearch";
import {
  removeCategoricalTraitValue,
  removeCharacterState,
} from "./stateUtils";
import { CharacterStateFormValue } from "./validation";

type CharacterEditingFormProps = {
  value: CharacterStateFormValue[];
  onChange: (next: CharacterStateFormValue[]) => void;
};

export function CharacterEditingForm({
  value,
  onChange,
}: CharacterEditingFormProps) {
  const { getValues } = useFormContext<TaxonEditFormValues>();

  const [openGroupIds, setOpenGroupIds] = useState<number[]>(() => {
    const seen = new Set<number>();
    for (const row of value) {
      seen.add(row.groupId);
    }
    return Array.from(seen);
  });

  const handleGroupSelect = (option: ComboboxOption) => {
    // Only add if not already present.
    setOpenGroupIds((prev) => {
      if (prev.some((gId) => gId === option.id)) {
        return prev;
      }
      return [...prev, option.id];
    });
  };

  const handleDeleteGroup = (groupId: number, characterIds: number[]) => {
    // Remove all character states associated with this group.
    if (characterIds.length > 0) {
      const current = getValues("characters");
      const next = current.filter(
        (row) => !characterIds.includes(row.characterId),
      );
      onChange(next);
    }
    // Close the group card.
    setOpenGroupIds((prev) => prev.filter((gId) => gId !== groupId));
  };

  // Group states by groupId for efficient per-card updates
  const statesByGroupId = useMemo(() => {
    const map = new Map<number, CharacterStateFormValue[]>();
    for (const row of value) {
      const existing = map.get(row.groupId);
      if (existing) {
        existing.push(row);
      } else {
        map.set(row.groupId, [row]);
      }
    }
    return map;
  }, [value]);

  // getValues is stable, so these callbacks are stable
  const handleRemoveCategoricalValue = useCallback(
    (characterId: number, traitValueId: number) => {
      const current = getValues("characters");
      const next = removeCategoricalTraitValue(
        current,
        characterId,
        traitValueId,
      );
      onChange(next);
    },
    [getValues, onChange],
  );

  const handleRemoveState = useCallback(
    (characterId: number) => {
      const current = getValues("characters");
      const next = removeCharacterState(current, characterId);
      onChange(next);
    },
    [getValues, onChange],
  );

  return (
    <FormDescriptor
      title="Characters"
      description="To add a character, first use the group search to add a character group. Once added, you can select trait values for the characters in that group."
    >
      <Box>
        <Box mb="4">
          <GroupSearch onSelect={handleGroupSelect} />
        </Box>
        <div className="character-group-card-grid">
          {openGroupIds.map((gId) => (
            <EditingGroupCard
              key={gId}
              groupId={gId}
              statesForGroup={statesByGroupId.get(gId) ?? []}
              onChange={onChange}
              onDelete={handleDeleteGroup}
              onRemoveCategoricalValue={handleRemoveCategoricalValue}
              onRemoveState={handleRemoveState}
            />
          ))}
        </div>
      </Box>
    </FormDescriptor>
  );
}
