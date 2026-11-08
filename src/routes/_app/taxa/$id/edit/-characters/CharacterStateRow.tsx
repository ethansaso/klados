import {
  Accessibility,
  defaultPreset,
  PointerActivationConstraints,
  PointerSensor,
} from "@dnd-kit/dom";
import { DragDropProvider } from "@dnd-kit/react";
import { DataList, Flex, Text } from "@radix-ui/themes";
import { memo, useCallback } from "react";
import { CharacterStateDisplay } from "../../../../../../components/state-formatting/CharacterStateDisplay";
import type { FeatureDetailDTO } from "../../../../../../lib/domain/features/types";
import type { CategoricalValueSuggestion } from "../../../../../../lib/domain/suggestions/types";
import { COLOR_CHARACTER_LABEL } from "../../../../../../lib/domain/traits/colorPalette";
import { ImageColorButton } from "./ImageColorButton";
import { ModifierTag } from "./tags/ModifierTag";
import { useStateReorder } from "./useStateReorder";
import type {
  CharacterStateFormValue,
  ModifierTokenFormValue,
} from "./validation";

type CharacterStateRowProps = {
  featureLabel: string;
  character: FeatureDetailDTO["characters"][number];
  states: CharacterStateFormValue[];
  onRemoveState: (formId: string) => void;
  onUpdateModifiers: (formId: string, mods: ModifierTokenFormValue[]) => void;
  onMoveState: (
    characterId: number,
    fromIndex: number,
    toIndex: number,
  ) => void;
  /** If set, auto-opens the modifier popover for the matching tag. */
  autoOpenFormId?: string;
  onAutoOpenHandled?: () => void;
  /** Called when the user presses Enter on an empty modifier search. */
  onReturnToSearch?: () => void;
  onAddCategoricalSuggestions: (
    suggestions: CategoricalValueSuggestion[],
  ) => void;
};

// Pointer only; Enter and Space are for popovers
const SENSORS = [
  PointerSensor.configure({
    // Clicks must trigger popover. Also, don't disrupt touch scroll.
    activationConstraints: (event) =>
      event.pointerType === "touch"
        ? [new PointerActivationConstraints.Delay({ value: 250, tolerance: 5 })]
        : [new PointerActivationConstraints.Distance({ value: 5 })],
  }),
];

const PLUGINS = defaultPreset.plugins.filter(
  (plugin) => plugin !== Accessibility,
);

export const CharacterStateRow = memo(
  ({
    featureLabel,
    character,
    states,
    onRemoveState,
    onUpdateModifiers,
    onMoveState,
    autoOpenFormId,
    onAutoOpenHandled,
    onReturnToSearch,
    onAddCategoricalSuggestions,
  }: CharacterStateRowProps) => {
    const hasNoStates = !states.length;
    const handleMove = useCallback(
      (fromIndex: number, toIndex: number) =>
        onMoveState(character.id, fromIndex, toIndex),
      [onMoveState, character.id],
    );
    const { marker, handleDragMove, handleDragEnd } = useStateReorder(
      states,
      handleMove,
    );

    return (
      <DataList.Item>
        <DataList.Label
          style={{ color: hasNoStates ? "var(--gray-a7)" : undefined }}
        >
          <Flex align="center" justify="between" gap="2" width="100%">
            {character.label}
            {character.label === COLOR_CHARACTER_LABEL && (
              <ImageColorButton
                featureLabel={featureLabel}
                characterId={character.id}
                characterLabel={character.label}
                states={states}
                onAdd={onAddCategoricalSuggestions}
              />
            )}
          </Flex>
        </DataList.Label>
        <DataList.Value
          style={{ color: hasNoStates ? "var(--gray-a7)" : undefined }}
        >
          {hasNoStates ? (
            <Text size="1">—</Text>
          ) : (
            // One provider per character to keep states in list
            <DragDropProvider
              sensors={SENSORS}
              plugins={PLUGINS}
              onDragMove={handleDragMove}
              onDragEnd={handleDragEnd}
            >
              <Flex
                wrap="wrap"
                gap="1"
                className="character-editor__tag-list"
                maxWidth="100%"
              >
                {states.map((state, index) => (
                  <ModifierTag
                    key={state._formId}
                    id={state._formId}
                    index={index}
                    modifiers={state.modifiers}
                    onModifiersChange={(mods) =>
                      onUpdateModifiers(state._formId, mods)
                    }
                    onRemove={() => onRemoveState(state._formId)}
                    autoOpen={autoOpenFormId === state._formId}
                    onAutoOpenHandled={onAutoOpenHandled}
                    onReturnToSearch={onReturnToSearch}
                    dropMarker={
                      marker?.targetId === state._formId ? marker : undefined
                    }
                  >
                    <CharacterStateDisplay states={[state]} highlightAffixes />
                  </ModifierTag>
                ))}
              </Flex>
            </DragDropProvider>
          )}
        </DataList.Value>
      </DataList.Item>
    );
  },
);
