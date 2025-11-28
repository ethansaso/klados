import { KGTaxonNode } from "../hierarchy/types";

type TaxonGroup = KGTaxonNode[];

export type BranchRationale =
  | {
      kind: "character-values";
      characterId: number;
      groupId: number;
      traits: {
        id: number;
        label: string;
      }[];
      inverted: boolean;
    }
  | {
      kind: "group-present-absent";
      groupId: number;
      status: "present" | "absent";
    };

export type SplitBranch = {
  taxa: TaxonGroup;
  rationale: BranchRationale;
};

export type SplitResult = {
  branches: SplitBranch[];
  score: number;
};
