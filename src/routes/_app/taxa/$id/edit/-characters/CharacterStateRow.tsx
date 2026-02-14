import { DataList, Flex } from "@radix-ui/themes";
import { memo, useMemo } from "react";
import { CharacterStateDisplay } from "../../../../../../components/trait-tokens/CharacterStateDisplay";
import type { FeatureDetailDTO } from "../../../../../../lib/domain/features/types";
import { StateTagWrapper } from "./StateTagWrapper";
import type { CharacterStateFormValue } from "./validation";

type CharacterStateRowProps = {
  character: FeatureDetailDTO["characters"][number];
  state?: CharacterStateFormValue;
  onRemoveCategoricalValue: (characterId: number, traitValueId: number) => void;
  onRemoveState: (characterId: number) => void;
};

export const CharacterStateRow = memo(
  ({
    character,
    state,
    onRemoveCategoricalValue,
    onRemoveState,
  }: CharacterStateRowProps) => {
    const content = useMemo(() => {
      if (!state) return "—";

      switch (state.kind) {
        case "categorical":
          return state.traitValues.map((tv) => (
            <StateTagWrapper
              key={tv.id}
              onRemove={() => onRemoveCategoricalValue(character.id, tv.id)}
            >
              <CharacterStateDisplay
                state={{ kind: "categorical", traitValues: [tv] }}
              />
            </StateTagWrapper>
          ));

        case "number":
          return (
            <StateTagWrapper onRemove={() => onRemoveState(character.id)}>
              <CharacterStateDisplay
                state={{
                  kind: "number",
                  siBaseValue: state.siBaseValue,
                  unit: state.unit,
                }}
              />
            </StateTagWrapper>
          );

        case "range":
          return (
            <StateTagWrapper onRemove={() => onRemoveState(character.id)}>
              <CharacterStateDisplay
                state={{
                  kind: "range",
                  siBaseMin: state.siBaseMin,
                  siBaseMax: state.siBaseMax,
                  unit: state.unit,
                }}
              />
            </StateTagWrapper>
          );

        default:
          return "Unsupported kind";
      }
    }, [state, character.id, onRemoveCategoricalValue, onRemoveState]);

    return (
      <DataList.Item>
        <DataList.Label>{character.label}</DataList.Label>
        <DataList.Value>
          <Flex className="character-editor__tag-list">{content}</Flex>
        </DataList.Value>
      </DataList.Item>
    );
  },
);
