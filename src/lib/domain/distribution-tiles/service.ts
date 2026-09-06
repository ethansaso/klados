import { db } from "../../../../db/client";
import { storage } from "../../storage";
import {
  densityTileUrl,
  fetchDensityTile,
  fetchOccurrenceTotal,
  TILE_COLUMNS,
} from "./gbif";
import {
  selectDistributionTile,
  selectTaxonGbifId,
  upsertDistributionTile,
} from "./repo";
import type { DistributionTileState } from "./types";
import {
  canServeCached,
  distributionTileKey,
  distributionTileKeys,
  needsRegeneration,
} from "./utils";

const TILE_CACHE_CONTROL = "public, max-age=86400";

/** Returns both rendering source and cache status. */
async function getDistributionTileState(
  taxonId: number,
): Promise<DistributionTileState> {
  const gbifId = await selectTaxonGbifId(db, taxonId);
  if (gbifId === null) {
    return { source: { kind: "unlinked" }, needsRegeneration: false };
  }

  const row = await selectDistributionTile(db, taxonId);

  return {
    source: canServeCached(row, gbifId)
      ? { kind: "cached", storageKeys: distributionTileKeys(taxonId) }
      : { kind: "live", gbifId },
    needsRegeneration: needsRegeneration(row, gbifId),
  };
}

/** Rebuilds a taxon's tiles; safe to call redundantly (but will request multiple times). */
async function regenerateDistributionTiles(taxonId: number): Promise<void> {
  const gbifId = await selectTaxonGbifId(db, taxonId);
  if (gbifId === null) return;

  try {
    const tiles = await Promise.all(
      TILE_COLUMNS.map((column) => fetchDensityTile(gbifId, column)),
    );

    await Promise.all(
      tiles.map((body, index) =>
        storage.upload({
          key: distributionTileKey(taxonId, TILE_COLUMNS[index]!),
          body,
          contentType: "image/png",
          cacheControl: TILE_CACHE_CONTROL,
        }),
      ),
    );

    const total = await fetchOccurrenceTotal(gbifId);

    await upsertDistributionTile(db, {
      taxonId,
      gbifId,
      status: total === 0 ? "empty" : "ok",
    });
  } catch {
    // Records failure to prevent later hammering of GBIF API
    await upsertDistributionTile(db, { taxonId, gbifId, status: "failed" });
  }
}

/** Resolved tile URLs based on cache status. */
export async function getDistributionTiles(
  taxonId: number,
): Promise<string[] | null> {
  const { source, needsRegeneration: shouldRegenerate } =
    await getDistributionTileState(taxonId);

  // Unawaited -- just return whatever was cached and lazily refresh
  if (shouldRegenerate) {
    void regenerateDistributionTiles(taxonId).catch((err: unknown) => {
      console.error(`[tiles] regeneration failed for taxon ${taxonId}:`, err);
    });
  }

  switch (source.kind) {
    case "unlinked":
      return null;
    case "cached":
      return source.storageKeys.map((key) => storage.getUrl(key));
    case "live":
      return TILE_COLUMNS.map((column) =>
        densityTileUrl(source.gbifId, column),
      );
  }
}
