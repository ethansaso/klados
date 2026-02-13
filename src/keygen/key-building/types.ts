export type KeyTaxonNode = {
  kind: "taxon";
  id: string;
  branches: KeyBranch[];
};

export type KeyDiffNode = {
  kind: "diff";
  id: string;
  branches: KeyBranch[];
};

export type KeyNode = KeyTaxonNode | KeyDiffNode;

type BaseKeyRationale = {
  annotation: string | null;
};

export type KeyCharRationale = BaseKeyRationale & {
  kind: "character-definition";
  /** Mapping of character IDs to their traits and inversion status */
  characters: Record<
    number,
    {
      traits: number[];
      inverted: boolean;
    }
  >;
};

export type KeyPAFeatureRationale = BaseKeyRationale & {
  kind: "feature-present-absent";
  /** Mapping of feature IDs to their presence or absence status */
  features: Record<
    number,
    {
      featureId: number;
      status: "present" | "absent";
    }
  >;
};

export type KeyCustomRationale = BaseKeyRationale & {};

export type KeyBranchRationale =
  | KeyCharRationale
  | KeyPAFeatureRationale
  | null;

export type KeyBranch = {
  id: string;
  rationale: KeyBranchRationale;
  child: KeyNode;
};
