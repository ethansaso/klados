import { SplitResult, TaxonGroup } from "../grouping/types";

export type KeyBranch = {
  // The taxa on this branch of the split
  taxa: TaxonGroup;
  // The edge info: one branch from the chosen SplitResult
  edge: SplitResult extends infer S
    ? S extends { branches: infer B }
      ? B extends (infer Branch)[]
        ? Branch
        : never
      : never
    : never;
  child: KeyNode;
};

/** A leaf node in the key tree, representing a final group of taxa at a shared rank. */
export type KeyLeafNode = {
  kind: "leaf";
  /**
   * In most cases, this will contain a single taxon.
   * However, it may contain multiple if they could not be further resolved.
   */
  taxa: TaxonGroup;
};

/** A split node in the key tree, representing a decision point based on some grouping mechanism. */
export type KeySplitNode = {
  kind: "split";
  split: SplitResult;
  branches: KeyBranch[];
};

export type KeyNode = KeyLeafNode | KeySplitNode;
