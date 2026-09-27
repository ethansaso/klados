import { TILE_COLUMNS } from "./gbif";
import type { DistributionTileRow } from "./types";

/** Stale after a month */
const STALE_AFTER_MS = 30 * 24 * 60 * 60 * 1000;
/** Retry failure after an hour */
const RETRY_FAILED_AFTER_MS = 60 * 60 * 1000;

export function distributionTileKey(taxonId: number, column: number): string {
  return `tiles/distribution/${taxonId}/${column}.png`;
}
export function distributionTileKeys(taxonId: number): string[] {
  return TILE_COLUMNS.map((column) => distributionTileKey(taxonId, column));
}

/**
 * Checks:
 * 1) Row exists
 * 2) Row's GBIF id matches taxon's GBIF id
 * 3) Row indicates previous fetch hadn't failed
 */
export function canServeCached(
  row: DistributionTileRow | null,
  gbifId: number,
): row is DistributionTileRow {
  return row !== null && row.gbifId === gbifId && row.status !== "failed";
}

export function needsRegeneration(
  row: DistributionTileRow | null,
  gbifId: number,
  now: Date = new Date(),
): boolean {
  // Never built / doesn't match a changed GBIF ID
  if (row === null || row.gbifId !== gbifId) return true;

  const age = now.getTime() - row.generatedAt.getTime();

  return row.status === "failed"
    ? age > RETRY_FAILED_AFTER_MS
    : age > STALE_AFTER_MS;
}
