import { Trait } from "../lib/domain/character-states/types";

export type FrontendTaxonNode = {
  kind: "taxon";
  id: number;
  sciName: string;
  commonName?: string;
  imgUrl?: string;
  branches: FrontendKeyBranch[];
};

export type FrontendDiffNode = {
  kind: "diff";
  id: string;
  branches: FrontendKeyBranch[];
};

export type FrontendKeyNode = FrontendTaxonNode | FrontendDiffNode;

type FrontendCharRationale = {
  kind: "character-definition";
  characters: Record<
    number,
    {
      name: string;
      traits: Trait[];
      inverted: boolean;
    }
  >;
};

type FrontendPAGroupRationale = {
  kind: "group-present-absent";
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
  | FrontendPAGroupRationale;

export type FrontendKeyBranch = {
  id: string;
  rationale: FrontendBranchRationale;
  child: FrontendKeyNode;
};
