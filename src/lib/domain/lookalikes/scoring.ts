import type { FeaturePresence } from "../../../../db/schema/schema";
import type { FeatureStateDTO } from "../states/types";
import { colorSimilarity } from "../traits/colorSimilarity";

/** Synonym set id to its swatch hex, if any. */
type SlotValues = Map<number, string | undefined>;

type SlotProfile = {
  presence: Map<number, FeaturePresence>;
  /** Values recorded per `featureId:characterId` slot. */
  values: Map<string, SlotValues>;
};

export type LookalikeScore = {
  score: number;
  sharedSlotCount: number;
};

/** Neutral pseudo-slots, so taxa overlapping on only a few slots can't score near 100%. */
const PRIOR_SLOTS = 5;
const PRIOR_SIMILARITY = 0.5;

function buildSlotProfile(features: FeatureStateDTO[]): SlotProfile {
  const presence = new Map<number, FeaturePresence>();
  const values = new Map<string, SlotValues>();

  for (const feature of features) {
    presence.set(feature.featureId, feature.presence);
    for (const state of feature.states) {
      // TODO: consider number/range as well
      if (state.kind !== "categorical") continue;
      const key = `${feature.featureId}:${state.characterId}`;
      const slot: SlotValues = values.get(key) ?? new Map();
      slot.set(state.trait.synonymSetId, state.trait.hexCode);
      values.set(key, slot);
    }
  }

  return { presence, values };
}

/** Mean, over both sides, of how well each value is matched on the other. */
function valueSimilarity(a: SlotValues, b: SlotValues): number {
  return (meanBestMatch(a, b) + meanBestMatch(b, a)) / 2;
}

function meanBestMatch(from: SlotValues, to: SlotValues): number {
  let total = 0;
  for (const [setId, hex] of from) {
    let best = 0;
    for (const [otherSetId, otherHex] of to) {
      if (setId === otherSetId) {
        best = 1;
        break;
      }
      if (hex && otherHex)
        best = Math.max(best, colorSimilarity(hex, otherHex));
    }
    total += best;
  }
  return total / from.size;
}

function presenceSimilarity(a: FeaturePresence, b: FeaturePresence): number {
  if (a === b) return 1;
  return a === "variable" || b === "variable" ? 0.5 : 0;
}

/**
 * Compares two taxa slot by slot (feature + character), only where both
 * record something: silence is neutral, contradictions count against.
 */
export function scoreLookalike(
  target: FeatureStateDTO[],
  candidate: FeatureStateDTO[],
): LookalikeScore {
  const a = buildSlotProfile(target);
  const b = buildSlotProfile(candidate);
  let total = 0;
  let sharedSlotCount = 0;

  for (const [key, aValues] of a.values) {
    const bValues = b.values.get(key);
    if (!bValues) continue;
    total += valueSimilarity(aValues, bValues);
    sharedSlotCount++;
  }

  for (const [featureId, aPresence] of a.presence) {
    const bPresence = b.presence.get(featureId);
    // Both merely present carries no signal, and would reward longer descriptions
    if (!bPresence || (aPresence === "present" && bPresence === "present")) {
      continue;
    }
    total += presenceSimilarity(aPresence, bPresence);
    sharedSlotCount++;
  }

  const score =
    (total + PRIOR_SLOTS * PRIOR_SIMILARITY) / (sharedSlotCount + PRIOR_SLOTS);
  return { score, sharedSlotCount };
}
