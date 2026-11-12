import type { FeaturePresence } from "../../../../db/schema/schema";
import type { FeatureTreeNode } from "../features/types";
import { resolvePresence } from "../states/resolvePresence";
import type { FeatureStateDTO } from "../states/types";
import { colorSimilarity } from "../traits/colorSimilarity";

/** Synonym set id to its swatch hex, if any. */
type SlotValues = Map<number, string | undefined>;

type SlotProfile = {
  /** Marked features only. */
  marked: Set<number>;
  /** Marks plus what they imply; see resolvePresence. */
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

function buildSlotProfile(
  tree: FeatureTreeNode[],
  features: FeatureStateDTO[],
  excludedFeatureIds: ReadonlySet<number>,
): SlotProfile {
  const values = new Map<string, SlotValues>();
  const included = features.filter(
    (feature) => !excludedFeatureIds.has(feature.featureId),
  );

  for (const feature of included) {
    for (const state of feature.states) {
      // TODO: consider number/range as well
      if (state.kind !== "categorical") continue;
      const key = `${feature.featureId}:${state.characterId}`;
      const slot: SlotValues = values.get(key) ?? new Map();
      slot.set(state.trait.synonymSetId, state.trait.hexCode);
      values.set(key, slot);
    }
  }

  // Resolved over every mark, so excluded features still inform the hierarchy
  const presence = resolvePresence(tree, features, {
    inferExplicitAbsence: true,
  });
  for (const featureId of excludedFeatureIds) presence.delete(featureId);

  return {
    marked: new Set(included.map((feature) => feature.featureId)),
    presence,
    values,
  };
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
 * Compares two taxa slot by slot (feature + character):
 * - Recorded by both: scored by how well the values match.
 * - Recorded by one, and the other lacks the feature, by mark or inference
 *   (e.g. gill color vs. pores): 0, or 0.5 if the recording taxon marks the
 *   feature variable.
 * - Recorded by one, and the other has the feature or its presence is
 *   unknown: not scored, since the other just didn't describe that character.
 * Presence marks are compared as extra slots. Unmarked Explicit features count
 * as absent, and excluded features (e.g. not field-diagnosable) are ignored.
 */
export function scoreLookalike(
  tree: FeatureTreeNode[],
  target: FeatureStateDTO[],
  candidate: FeatureStateDTO[],
  excludedFeatureIds: ReadonlySet<number>,
): LookalikeScore {
  const a = buildSlotProfile(tree, target, excludedFeatureIds);
  const b = buildSlotProfile(tree, candidate, excludedFeatureIds);
  let total = 0;
  let sharedSlotCount = 0;

  for (const [key, aValues] of a.values) {
    const bValues = b.values.get(key);
    const featureId = Number(key.split(":")[0]);
    if (bValues) {
      total += valueSimilarity(aValues, bValues);
      sharedSlotCount++;
    } else if (b.presence.get(featureId) === "absent") {
      total += presenceSimilarity(a.presence.get(featureId)!, "absent");
      sharedSlotCount++;
    }
  }
  for (const key of b.values.keys()) {
    const featureId = Number(key.split(":")[0]);
    if (!a.values.has(key) && a.presence.get(featureId) === "absent") {
      total += presenceSimilarity(b.presence.get(featureId)!, "absent");
      sharedSlotCount++;
    }
  }

  // Only features someone marked; two inferences never agree with each other
  for (const featureId of new Set([...a.marked, ...b.marked])) {
    const aPresence = a.presence.get(featureId);
    const bPresence = b.presence.get(featureId);
    // Both merely present carries no signal, and would reward longer descriptions
    if (
      !aPresence ||
      !bPresence ||
      (aPresence === "present" && bPresence === "present")
    ) {
      continue;
    }
    total += presenceSimilarity(aPresence, bPresence);
    sharedSlotCount++;
  }

  const score =
    (total + PRIOR_SLOTS * PRIOR_SIMILARITY) / (sharedSlotCount + PRIOR_SLOTS);
  return { score, sharedSlotCount };
}
