import { Box, Heading } from "@radix-ui/themes";
import { useMemo, useState } from "react";
import { ComboboxOption } from "../../../../../../components/inputs/combobox/types";
import { GroupCard } from "./GroupCard";
import { GroupSearch } from "./GroupSearch";
import { CharacterStateFormValue } from "./validation";

type CharacterEditingFormProps = {
  value: CharacterStateFormValue[];
  onChange: (next: CharacterStateFormValue[]) => void;
};

export function CharacterEditingForm({
  value,
  onChange,
}: CharacterEditingFormProps) {
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
      const next = value.filter(
        (row) => !characterIds.includes(row.characterId)
      );
      onChange(next);
    }
    // Close the group card.
    setOpenGroupIds((prev) => prev.filter((gId) => gId !== groupId));
  };

  const stateByCharacterId = useMemo(() => {
    const map = new Map<number, CharacterStateFormValue[]>();
    for (const row of value) {
      const arr = map.get(row.characterId) ?? [];
      arr.push(row);
      map.set(row.characterId, arr);
    }
    return map;
  }, [value]);

  return (
    <Box mb="3">
      <Heading size="3">Characters</Heading>
      <GroupSearch onSelect={handleGroupSelect} />
      <div className="editor-card-grid">
        {openGroupIds.map((gId) => (
          <GroupCard
            key={gId}
            groupId={gId}
            value={value}
            stateByCharacterId={stateByCharacterId}
            onChange={onChange}
            onDelete={handleDeleteGroup}
          />
        ))}
      </div>
    </Box>
  );
}
