import { Trait } from "../../lib/domain/character-states/types";
import { MediaItem } from "../../lib/domain/taxa/validation";
import {
  KeyCharRationale,
  KeyDiffNode,
  KeyPAGroupRationale,
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

export type HydratedPAGroupRationale = Omit<KeyPAGroupRationale, "groups"> & {
  groups: Record<
    number,
    {
      groupId: number;
      name: string;
      status: "present" | "absent";
    }
  >;
};

export type HydratedBranchRationale =
  | HydratedCharRationale
  | HydratedPAGroupRationale
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
