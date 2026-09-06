import { integer, pgEnum, pgTable, timestamp } from "drizzle-orm/pg-core";
import { withTimestamps } from "../../utils/timestamps";
import { taxon } from "./taxon";

export type DistributionTileStatus =
  (typeof DISTRIBUTION_TILE_STATUSES)[number];
export const DISTRIBUTION_TILE_STATUSES = ["ok", "empty", "failed"] as const;
export const distributionTileStatus = pgEnum(
  "distribution_tile_status",
  DISTRIBUTION_TILE_STATUSES,
);

/**
 * Metadata for cached GBIF occurrence tiles for a taxon.
 * Actual images in file storage.
 */
export const taxonDistributionTile = pgTable(
  "taxon_distribution_tile",
  withTimestamps({
    taxonId: integer("taxon_id")
      .primaryKey()
      .references(() => taxon.id, { onDelete: "cascade" }),
    gbifId: integer("gbif_id").notNull(),

    status: distributionTileStatus("status").notNull(),
    /** Null unless status is 'ok' or 'empty'. */

    generatedAt: timestamp("generated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  }),
);
