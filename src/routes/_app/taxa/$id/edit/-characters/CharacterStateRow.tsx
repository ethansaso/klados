// character-rows/CharacterStateRow.tsx
import { DataList, Flex } from "@radix-ui/themes";
import { CharacterGroupDetailDTO } from "../../../../../../lib/serverFns/character-groups/types";
import { removeCategoricalTraitValue } from "./stateUtils";
import { CategoricalStateTag } from "./tags/CategoricalStateTag";
import { CharacterStateFormValue } from "./validation";

type CharacterStateRowProps = {
  character: CharacterGroupDetailDTO["characters"][number];
  states: CharacterStateFormValue[]; // for this character
  allStates: CharacterStateFormValue[]; // full form slice
  onChangeAllStates: (next: CharacterStateFormValue[]) => void;
};

export function CharacterStateRow({
  character,
  states,
  allStates,
  onChangeAllStates,
}: CharacterStateRowProps) {
  // For now we expect at most one state per character.
  const state = states[0];

  const handleRemoveCategorical = (traitValueId: number) => {
    const next = removeCategoricalTraitValue(
      allStates,
      character.id,
      traitValueId
    );
    onChangeAllStates(next);
  };

  let content: React.ReactNode = "—";

  if (state) {
    switch (state.kind) {
      case "categorical":
        content = state.traitValues.map((tv) => (
          <CategoricalStateTag
            key={tv.id}
            characterId={state.characterId}
            traitValue={tv}
            onRemove={handleRemoveCategorical}
          />
        ));
        break;

      // case "number":
      //   content = <NumericCharacterContent ... />;
      //   break;

      // case "range":
      //   content = <NumericRangeCharacterContent ... />;
      //   break;

      default:
        content = "Unsupported kind";
    }
  }

  return (
    <DataList.Item>
      <DataList.Label>{character.label}</DataList.Label>
      <DataList.Value>
        <Flex className="character-editor__tag-list">{content}</Flex>
      </DataList.Value>
    </DataList.Item>
  );
}
