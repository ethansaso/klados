import type { FeaturePresence } from "../../../../../../db/schema/schema";
import { formatCharacterStatesText } from "../../../../../components/state-formatting/formatting";
import type {
  CharacterStateDTO,
  FeatureStateDTO,
} from "../../../../../lib/domain/states/types";

export const PRESENCE_LABELS: Record<FeaturePresence, string> = {
  present: "present",
  variable: "sometimes present",
  absent: "absent",
};

export function sortFeatures(features: FeatureStateDTO[]) {
  return [...features].sort((left, right) =>
    left.featureLabel.localeCompare(right.featureLabel),
  );
}

/** Groups states by character, preserving order of first appearance. */
export function groupStatesByCharacter(states: CharacterStateDTO[]) {
  const groups = new Map<
    number,
    {
      label: string;
      hasInfo: boolean;
      showInProse: boolean;
      states: CharacterStateDTO[];
    }
  >();
  for (const state of states) {
    let group = groups.get(state.characterId);
    if (!group) {
      group = {
        label: state.characterLabel,
        hasInfo: state.characterHasInfo,
        showInProse: state.showInProse,
        states: [],
      };
      groups.set(state.characterId, group);
    }
    group.states.push(state);
  }
  return Array.from(groups.entries());
}

/** Plain-text equivalent of the prose morphological description. */
export function formatFeaturesText(features: FeatureStateDTO[]): string {
  return sortFeatures(features).map(formatFeatureText).join(" ");
}

function formatFeatureText(feature: FeatureStateDTO): string {
  const entries = groupStatesByCharacter(feature.states);
  const body = entries.length
    ? entries
        .map(
          ([, { label, showInProse, states }]) =>
            `${showInProse ? `${label.toLowerCase()} ` : ""}${formatCharacterStatesText(states)}`,
        )
        .join("; ")
    : PRESENCE_LABELS[feature.presence];
  const whenPresent =
    feature.presence === "variable" && entries.length ? "when present, " : "";
  const notes = feature.notes.trim();

  return `${feature.featureLabel} ${whenPresent}${body}${notes ? `; ${notes}` : ""}.`;
}
