export type KeyGenOptions = {
  /**
   * Limit on the number of taxa to process during BFS step.
   * "Retreats" to lowest rank in BFS if exceeded.
   */
  taxonLimit?: number;
  /**
   * Shape of the generated key.
   * Balanced will attempt to evenly split taxa at each step.
   * Lopsided will favor splits that isolate small groups of taxa.
   */
  keyShape: "balanced" | "lopsided";
  /**
   * Maximum number of branches to allow at any split in the key.
   */
  maxBranches: number;
};

export const DEFAULT_KEYGEN_OPTIONS: KeyGenOptions = {
  keyShape: "balanced",
  maxBranches: 5,
};
