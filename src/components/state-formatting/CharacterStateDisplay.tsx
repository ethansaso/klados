import { Text } from "@radix-ui/themes";
import { memo } from "react";
import { CategoricalStateDisplay } from "./displays/CategoricalStateDisplay";
import { NumericStateDisplay } from "./displays/NumericStateDisplay";
import { AffixedValue } from "./helpers/AffixedValue";
import type { UICharacterState } from "./types";

type Props = {
  states: UICharacterState[];
  /**
   * When true, prefix modifiers are rendered in crimson and suffix modifiers
   * in cyan.
   */
  highlightAffixes?: boolean;
  /**
   * When true, no uppercasing will be applied in formatting.
   */
  forceLowercase?: boolean;
};

function SingleStateDisplay({
  state,
  isLast,
  highlightAffixes,
  lowercaseFirst,
  hideModifiers,
}: {
  state: UICharacterState;
  isLast: boolean;
  highlightAffixes?: boolean;
  lowercaseFirst?: boolean;
  hideModifiers?: boolean;
}) {
  switch (state.kind) {
    case "categorical":
      return (
        <CategoricalStateDisplay
          state={state}
          isLast={isLast}
          highlightAffixes={highlightAffixes}
          lowercaseFirst={lowercaseFirst}
          hideModifiers={hideModifiers}
        />
      );
    case "number":
    case "range":
      return (
        <NumericStateDisplay
          state={state}
          isLast={isLast}
          highlightAffixes={highlightAffixes}
          hideModifiers={hideModifiers}
        />
      );
  }
}

function getStateModifiers(state: UICharacterState) {
  return state.modifiers ?? [];
}

function getModifierSignature(state: UICharacterState): string {
  return getStateModifiers(state)
    .map((modifier) =>
      [modifier.id, modifier.value, modifier.affixType, modifier.groupId].join(
        ":",
      ),
    )
    .join("|");
}

function getStateKey(state: UICharacterState): string {
  switch (state.kind) {
    case "categorical":
      return `categorical:${state.trait.id}:${getModifierSignature(state)}`;
    case "number":
      return `number:${state.siBaseValue}:${getModifierSignature(state)}`;
    case "range":
      return `range:${state.siBaseMin ?? ""}:${state.siBaseMax ?? ""}:${getModifierSignature(state)}`;
  }
}

function collapseStatesByExactModifiers(states: UICharacterState[]) {
  return states.reduce<
    Array<{ states: UICharacterState[]; signature: string }>
  >((groups, state) => {
    const signature = getModifierSignature(state);
    const lastGroup = groups.at(-1);

    if (
      signature.length > 0 &&
      lastGroup &&
      lastGroup.signature === signature
    ) {
      lastGroup.states.push(state);
      return groups;
    }

    groups.push({ states: [state], signature });
    return groups;
  }, []);
}

export const CharacterStateDisplay = memo(
  ({ states, highlightAffixes, forceLowercase }: Props) => {
    if (states.length === 1) {
      return (
        <SingleStateDisplay
          state={states[0]!}
          isLast
          highlightAffixes={highlightAffixes}
          lowercaseFirst={forceLowercase}
        />
      );
    }

    const collapsedGroups = collapseStatesByExactModifiers(states);

    return (
      <Text as="span">
        {collapsedGroups.map(
          ({ states: groupStates, signature }, groupIndex) => (
            <Text
              as="span"
              key={`${getStateKey(groupStates[0]!)}:${signature}:${groupStates.length}`}
            >
              {groupIndex > 0 && " "}
              {groupStates.length === 1 ? (
                <SingleStateDisplay
                  state={groupStates[0]!}
                  isLast={groupIndex === collapsedGroups.length - 1}
                  highlightAffixes={highlightAffixes}
                  lowercaseFirst={forceLowercase || groupIndex > 0}
                />
              ) : (
                <AffixedValue
                  modifiers={getStateModifiers(groupStates[0]!)}
                  weight={
                    groupStates[0]!.kind === "categorical"
                      ? groupStates[0]!.trait.weight
                      : groupStates[0]!.weight
                  }
                  isLast={groupIndex === collapsedGroups.length - 1}
                  highlightAffixes={highlightAffixes}
                  lowercaseFirst={forceLowercase || groupIndex > 0}
                >
                  {groupStates.map((state, stateIndex) => (
                    <Text as="span" key={getStateKey(state)}>
                      {stateIndex > 0 && "/"}
                      <SingleStateDisplay
                        state={state}
                        isLast
                        lowercaseFirst
                        hideModifiers
                      />
                    </Text>
                  ))}
                </AffixedValue>
              )}
            </Text>
          ),
        )}
      </Text>
    );
  },
);
