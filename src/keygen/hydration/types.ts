import { Trait } from "../../lib/domain/character-states/types";
import {
  KeyCharRationale,
  KeyDiffNode,
  KeyPAGroupRationale,
  KeyTaxonNode,
} from "../key-building/types";

export type FrontendTaxonNode = Omit<KeyTaxonNode, "branches"> & {
  sciName: string;
  commonName?: string;
  imgUrl?: string;
  branches: FrontendKeyBranch[];
};

export type FrontendDiffNode = Omit<KeyDiffNode, "branches"> & {
  branches: FrontendKeyBranch[];
};

export type FrontendKeyNode = FrontendTaxonNode | FrontendDiffNode;

export type FrontendCharRationale = Omit<KeyCharRationale, "characters"> & {
  characters: Record<
    number,
    {
      name: string;
      traits: Trait[];
      inverted: boolean;
    }
  >;
};

export type FrontendPAGroupRationale = Omit<KeyPAGroupRationale, "groups"> & {
  groups: Record<
    number,
    {
      groupId: number;
      name: string;
      status: "present" | "absent";
    }
  >;
};

export type FrontendBranchRationale =
  | FrontendCharRationale
  | FrontendPAGroupRationale
  | null;

export type FrontendKeyBranch = {
  id: string;
  rationale: FrontendBranchRationale;
  child: FrontendKeyNode;
};
