import type { taxonDistributionTile } from "../../../../db/schema/schema";

export type DistributionTileRow = typeof taxonDistributionTile.$inferSelect;

export type DistributionTileSource =
  | { kind: "unlinked" }
  /** Storage keys in column order, plus the generation they came from. */
  | { kind: "cached"; storageKeys: string[]; version: number }
  | { kind: "live"; gbifId: number };

export type DistributionTileState = {
  source: DistributionTileSource;
  needsRegeneration: boolean;
};
