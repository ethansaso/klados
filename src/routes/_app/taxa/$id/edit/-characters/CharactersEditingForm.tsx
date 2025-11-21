import { Box, Heading } from "@radix-ui/themes";
import { useState } from "react";
import { ComboboxOption } from "../../../../../../components/inputs/combobox/types";
import { TaxonCharacterStateDTO } from "../../../../../../lib/serverFns/character-states/types";
import { GroupCard } from "./GroupCard";
import { GroupSearch } from "./GroupSearch";

type CharacterEditingFormProps = {
  value: TaxonCharacterStateDTO[];
  onChange: (next: TaxonCharacterStateDTO[]) => void;
};

export function CharacterEditingForm({
  value,
  onChange,
}: CharacterEditingFormProps) {
  const [groups, setGroups] = useState<ComboboxOption[]>([]);

  const foo = (option: ComboboxOption) => {
    // Only add if not already present.
    if (groups.find((g) => g.id === option.id)) {
      return;
    }
    setGroups((prev) => [...prev, option]);
  };

  return (
    <Box mb="3">
      <Heading size="3">Characters</Heading>
      <GroupSearch onSelect={foo} />
      {groups.map((g: any) => (
        <GroupCard key={g.id} />
      ))}
    </Box>
  );
}
