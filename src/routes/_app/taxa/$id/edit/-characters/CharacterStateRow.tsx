import { DataList, Flex, Text } from "@radix-ui/themes";
import { memo, useMemo } from "react";
import { CharacterStateDisplay } from "../../../../../../components/state-formatting/CharacterStateDisplay";
import type { FeatureDetailDTO } from "../../../../../../lib/domain/features/types";
import { ModifierTag } from "./tags/ModifierTag";
import type {
  CharacterStateFormValue,
  ModifierTokenFormValue,
} from "./validation";

type AutoOpenTarget = { characterId: number; traitIndex?: number };

type CharacterStateRowProps = {
  character: FeatureDetailDTO["characters"][number];
  states: CharacterStateFormValue[];
  onRemoveCategoricalTrait: (characterId: number, stateIndex: number) => void;
  onRemoveNumericState: (characterId: number, stateIndex: number) => void;
  onUpdateCategoricalModifiers: (
    characterId: number,
    stateIndex: number,
    mods: ModifierTokenFormValue[],
  ) => void;
  onUpdateNumericModifiers: (
    characterId: number,
    stateIndex: number,
    mods: ModifierTokenFormValue[],
  ) => void;
  /** If set, auto-opens the modifier popover for the matching tag. */
  autoOpenModifierFor?: AutoOpenTarget;
  onAutoOpenHandled?: () => void;
  /** Called when the user presses Enter on an empty modifier search. */
  onReturnToSearch?: () => void;
};

export const CharacterStateRow = memo(
  ({
    character,
    states,
    onRemoveCategoricalTrait,
    onRemoveNumericState,
    onUpdateCategoricalModifiers,
    onUpdateNumericModifiers,
    autoOpenModifierFor,
    onAutoOpenHandled,
    onReturnToSearch,
  }: CharacterStateRowProps) => {
    const hasNoStates = !states.length;
    const content = useMemo(() => {
      if (hasNoStates) {
        return <Text size="1">—</Text>;
      }

      const numericStates = states.filter(
        (
          state,
        ): state is Extract<
          CharacterStateFormValue,
          { kind: "number" | "range" }
        > => state.kind === "number" || state.kind === "range",
      );

      const categoricalStates = states.filter((s) => s.kind === "categorical");

      return states.flatMap((state) => {
        switch (state.kind) {
          case "categorical": {
            const catIdx = categoricalStates.indexOf(state);
            return (
              <ModifierTag
                key={`categorical:${catIdx}`}
                modifiers={state.modifiers}
                onModifiersChange={(mods) =>
                  onUpdateCategoricalModifiers(character.id, catIdx, mods)
                }
                onRemove={() => onRemoveCategoricalTrait(character.id, catIdx)}
                autoOpen={
                  autoOpenModifierFor?.characterId === character.id &&
                  autoOpenModifierFor.traitIndex === catIdx
                }
                onAutoOpenHandled={onAutoOpenHandled}
                onReturnToSearch={onReturnToSearch}
              >
                <CharacterStateDisplay
                  states={[
                    {
                      kind: "categorical",
                      trait: state.trait,
                      modifiers: state.modifiers,
                    },
                  ]}
                  highlightAffixes
                />
              </ModifierTag>
            );
          }

          case "number": {
            const numericIndex = numericStates.indexOf(state);
            return (
              <ModifierTag
                key={`number:${numericIndex}:${state.siBaseValue}`}
                modifiers={state.modifiers}
                onModifiersChange={(mods) =>
                  onUpdateNumericModifiers(character.id, numericIndex, mods)
                }
                onRemove={() =>
                  onRemoveNumericState(character.id, numericIndex)
                }
                autoOpen={
                  autoOpenModifierFor?.characterId === character.id &&
                  autoOpenModifierFor.traitIndex === undefined &&
                  numericIndex === numericStates.length - 1
                }
                onAutoOpenHandled={onAutoOpenHandled}
                onReturnToSearch={onReturnToSearch}
              >
                <CharacterStateDisplay
                  states={[
                    {
                      kind: "number",
                      siBaseValue: state.siBaseValue,
                      unit: state.unit,
                      modifiers: state.modifiers,
                    },
                  ]}
                  highlightAffixes
                />
              </ModifierTag>
            );
          }

          case "range": {
            const numericIndex = numericStates.indexOf(state);
            return (
              <ModifierTag
                key={`range:${numericIndex}:${state.siBaseMin ?? ""}:${state.siBaseMax ?? ""}`}
                modifiers={state.modifiers}
                onModifiersChange={(mods) =>
                  onUpdateNumericModifiers(character.id, numericIndex, mods)
                }
                onRemove={() =>
                  onRemoveNumericState(character.id, numericIndex)
                }
                autoOpen={
                  autoOpenModifierFor?.characterId === character.id &&
                  autoOpenModifierFor.traitIndex === undefined &&
                  numericIndex === numericStates.length - 1
                }
                onAutoOpenHandled={onAutoOpenHandled}
                onReturnToSearch={onReturnToSearch}
              >
                <CharacterStateDisplay
                  states={[
                    {
                      kind: "range",
                      siBaseMin: state.siBaseMin,
                      siBaseMax: state.siBaseMax,
                      unit: state.unit,
                      modifiers: state.modifiers,
                    },
                  ]}
                  highlightAffixes
                />
              </ModifierTag>
            );
          }

          default:
            return [];
        }
      });
    }, [
      hasNoStates,
      states,
      character.id,
      onRemoveCategoricalTrait,
      onRemoveNumericState,
      onUpdateCategoricalModifiers,
      onUpdateNumericModifiers,
      autoOpenModifierFor,
      onAutoOpenHandled,
      onReturnToSearch,
    ]);

    return (
      <DataList.Item>
        <DataList.Label
          style={{ color: hasNoStates ? "var(--gray-a7)" : undefined }}
        >
          {character.label}
        </DataList.Label>
        <DataList.Value
          style={{ color: hasNoStates ? "var(--gray-a7)" : undefined }}
        >
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
