import { type TaxonCharacterStateDTO } from "./types";

export type GroupedCharacterStates = {
  groupId: number;
  groupLabel: string;
  groupDescription: string;
  states: TaxonCharacterStateDTO[];
};

export function groupStatesByGroup(
  states: TaxonCharacterStateDTO[],
): GroupedCharacterStates[] {
  const groups = new Map<number, GroupedCharacterStates>();

  for (const state of states) {
    let group = groups.get(state.groupId);
    if (!group) {
      group = {
        groupId: state.groupId,
        groupLabel: state.groupLabel,
        groupDescription: state.groupDescription,
        states: [],
      };
      groups.set(state.groupId, group);
    }
    group.states.push(state);
  }

  return Array.from(groups.values());
}
