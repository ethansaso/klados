import type { MediaDTO } from "../../lib/domain/media/types";
import type { Trait } from "../../lib/domain/states/types";
import type { KeyDiffNode, KeyTaxonNode } from "../key-building/types";

export type HydratedTaxonNode = Omit<KeyTaxonNode, "branches"> & {
  sciName: string;
  commonName?: string;
  primaryMedia?: MediaDTO;
};

export type HydratedDiffNode = Omit<KeyDiffNode, "branches"> & {};

export type HydratedKeyNode = HydratedTaxonNode | HydratedDiffNode;

/** Hydrated version of a single character entry within a feature. */
export type HydratedCharacterEntry = {
  name: string;
  traits: Omit<Trait, "modifiers">[];
  inverted: boolean;
};

/** Hydrated present-feature entry: carries the feature name + any character detail. */
export type HydratedPresentFeatureEntry = {
  presence: "present";
  name: string;
  description?: string | null;
  /** characterId -> hydrated entry */
  characters: Record<number, HydratedCharacterEntry>;
};

/** Hydrated absent-feature entry: carries only the feature name. */
export type HydratedAbsentFeatureEntry = {
  presence: "absent";
  name: string;
  description?: string | null;
};

export type HydratedFeatureEntry =
  | HydratedPresentFeatureEntry
  | HydratedAbsentFeatureEntry;

/** Hydrated structured rationale: featureId -> hydrated entry. */
export type HydratedRichRationale = {
  kind: "rich";
  /** featureId -> entry */
  features: Record<number, HydratedFeatureEntry>;
  annotation: string | null;
};

/** Hydrated written rationale: free text override. */
export type HydratedWrittenRationale = {
  kind: "written";
  text: string;
};

export type HydratedBranchRationale =
  | HydratedRichRationale
  | HydratedWrittenRationale
  | null;

export type HydratedKeyBranch = {
  id: string;
  sourceId: string;
  targetId: string;
  rationale: HydratedBranchRationale;
};

export type HydratedKeyGraphDTO = {
  rootNodeId: string;
  nodes: HydratedKeyNode[];
  branches: HydratedKeyBranch[];
};
