import { DataList, Flex, Text } from "@radix-ui/themes";
import { memo, useMemo } from "react";
import { CharacterStateDisplay } from "../../../../../../components/state-formatting/CharacterStateDisplay";
import type { FeatureDetailDTO } from "../../../../../../lib/domain/features/types";
import { ModifierTag } from "./tags/ModifierTag";
import type {
  CharacterStateFormValue,
  ModifierTokenFormValue,
} from "./validation";

type AutoOpenTarget = { characterId: number; traitValueId?: number };

type CharacterStateRowProps = {
  character: FeatureDetailDTO["characters"][number];
  state?: CharacterStateFormValue;
  onRemoveCategoricalTrait: (characterId: number, traitValueId: number) => void;
  onRemoveState: (characterId: number) => void;
  onUpdateCategoricalModifiers: (
    characterId: number,
    traitValueId: number,
    mods: ModifierTokenFormValue[],
  ) => void;
  onUpdateNumericModifiers: (
    characterId: number,
    mods: ModifierTokenFormValue[],
  ) => void;
  /** If set, auto-opens the modifier popover for the matching tag. */
  autoOpenModifierFor?: AutoOpenTarget;
  onAutoOpenHandled?: () => void;
};

export const CharacterStateRow = memo(
  ({
    character,
    state,
    onRemoveCategoricalTrait,
    onRemoveState,
    onUpdateCategoricalModifiers,
    onUpdateNumericModifiers,
    autoOpenModifierFor,
    onAutoOpenHandled,
  }: CharacterStateRowProps) => {
    const content = useMemo(() => {
      if (!state) {
        return (
          <Text color="gray" size="1">
            —
          </Text>
        );
      }

      switch (state.kind) {
        case "categorical":
          return state.traitValues.map((tv) => (
            <ModifierTag
              key={tv.id}
              modifiers={tv.modifiers}
              onModifiersChange={(mods) =>
                onUpdateCategoricalModifiers(character.id, tv.id, mods)
              }
              onRemove={() => onRemoveCategoricalTrait(character.id, tv.id)}
              autoOpen={
                autoOpenModifierFor?.characterId === character.id &&
                autoOpenModifierFor.traitValueId === tv.id
              }
              onAutoOpenHandled={onAutoOpenHandled}
            >
              <CharacterStateDisplay
                state={{ kind: "categorical", traitValues: [tv] }}
                highlightAffixes
              />
            </ModifierTag>
          ));

        case "number":
          return (
            <ModifierTag
              modifiers={state.modifiers}
              onModifiersChange={(mods) =>
                onUpdateNumericModifiers(character.id, mods)
              }
              onRemove={() => onRemoveState(character.id)}
              autoOpen={
                autoOpenModifierFor?.characterId === character.id &&
                autoOpenModifierFor.traitValueId === undefined
              }
              onAutoOpenHandled={onAutoOpenHandled}
            >
              <CharacterStateDisplay
                state={{
                  kind: "number",
                  siBaseValue: state.siBaseValue,
                  unit: state.unit,
                  modifiers: state.modifiers,
                }}
                highlightAffixes
              />
            </ModifierTag>
          );

        case "range":
          return (
            <ModifierTag
              modifiers={state.modifiers}
              onModifiersChange={(mods) =>
                onUpdateNumericModifiers(character.id, mods)
              }
              onRemove={() => onRemoveState(character.id)}
              autoOpen={
                autoOpenModifierFor?.characterId === character.id &&
                autoOpenModifierFor.traitValueId === undefined
              }
              onAutoOpenHandled={onAutoOpenHandled}
            >
              <CharacterStateDisplay
                state={{
                  kind: "range",
                  siBaseMin: state.siBaseMin,
                  siBaseMax: state.siBaseMax,
                  unit: state.unit,
                  modifiers: state.modifiers,
                }}
                highlightAffixes
              />
            </ModifierTag>
          );

        default:
          return "Unsupported kind";
      }
    }, [
      state,
      character.id,
      onRemoveCategoricalTrait,
      onRemoveState,
      onUpdateCategoricalModifiers,
      onUpdateNumericModifiers,
      autoOpenModifierFor,
      onAutoOpenHandled,
    ]);

    return (
      <DataList.Item>
        <DataList.Label>{character.label}</DataList.Label>
        <DataList.Value>
          <Flex
            wrap="wrap"
            gap="1"
            className="character-editor__tag-list"
            maxWidth="100%"
          >
            {content}
          </Flex>
        </DataList.Value>
      </DataList.Item>
    );
  },
);
