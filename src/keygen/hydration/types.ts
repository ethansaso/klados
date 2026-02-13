import type { Trait } from "../../lib/domain/states/types";
import type { MediaItem } from "../../lib/domain/taxa/validation";
import type {
  KeyCharRationale,
  KeyDiffNode,
  KeyPAFeatureRationale,
  KeyTaxonNode,
} from "../key-building/types";

export type HydratedTaxonNode = Omit<KeyTaxonNode, "branches"> & {
  sciName: string;
  commonName?: string;
  primaryMedia?: MediaItem;
};

export type HydratedDiffNode = Omit<KeyDiffNode, "branches"> & {};

export type HydratedKeyNode = HydratedTaxonNode | HydratedDiffNode;

export type HydratedCharRationale = Omit<KeyCharRationale, "characters"> & {
  characters: Record<
    number,
    {
      name: string;
      traits: Trait[];
      inverted: boolean;
    }
  >;
};

export type HydratedPAFeatureRationale = Omit<
  KeyPAFeatureRationale,
  "features"
> & {
  features: Record<
    number,
    {
      featureId: number;
      name: string;
      status: "present" | "absent";
    }
  >;
};

export type HydratedBranchRationale =
  | HydratedCharRationale
  | HydratedPAFeatureRationale
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
