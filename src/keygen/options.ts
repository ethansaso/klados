export type KeyGenOptions = {
  /**
   * Limit on the number of taxa to process during BFS step.
   * "Retreats" to lowest rank in BFS if exceeded.
   */
  taxonLimit?: number;
};

export const DEFAULT_KEYGEN_OPTIONS: KeyGenOptions = {};
