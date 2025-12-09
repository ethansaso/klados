import z from "zod";

const HARD_MAX_TAXON_LIMIT = 500;

export const KeyGenOptionsSchema = z.object({
  /**
   * Limit on the number of taxa to process during BFS step.
   * "Retreats" to lowest rank in BFS if exceeded.
   */
  taxonLimit: z
    .number()
    .int()
    .positive()
    .max(HARD_MAX_TAXON_LIMIT)
    .default(500),

  /**
   * Shape of the generated key.
   * Balanced will attempt to evenly split taxa at each step.
   * Lopsided will favor splits that isolate small groups of taxa.
   */
  keyShape: z.enum(["balanced", "narrow", "bushy"]).default("balanced"),

  /**
   * Maximum number of branches to allow at any split in the key.
   */
  maxBranches: z.number().int().min(2).max(10).default(5),

  /**
   * Maximum subtaxon depth of the generated key.
   * Works independently from rank to handle incertae sedis
   * and other irregularities in taxon hierarchy.
   */
  maxDepthFromRoot: z.number().int().min(1).max(10).optional(),
});

/**
 * Normalize raw/partial options into a fully-defaulted KeyGenOptions.
 */
export function normalizeKeyGenOptions(
  input?: KeyGenOptionsInput
): KeyGenOptions {
  // if nothing passed, this is equivalent to "all defaults"
  return KeyGenOptionsSchema.parse(input ?? {});
}

export type KeyGenOptionsInput = z.input<typeof KeyGenOptionsSchema>;
export type KeyGenOptions = z.infer<typeof KeyGenOptionsSchema>;
