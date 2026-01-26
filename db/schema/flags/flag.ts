import { sql } from "drizzle-orm";
import {
  index,
  integer,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { withTimestamps } from "../../utils/timestamps";
import { user } from "../schema";
import { taxon } from "../taxa/taxon";

/**
 * Moderation status of the flag.
 */
export const flagStatus = pgEnum("flag_status", [
  "open",
  "acknowledged",
  "resolved",
  "dismissed",
]);

/**
 * Shared columns used by all flag tables.
 * Intended to be spread into specific flag tables.
 */
function createFlagBaseColumns() {
  return {
    // Who submitted the flag
    createdByUserId: text("created_by_user_id")
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),
    // Free-text explanation
    details: text("details").notNull().default(""),

    // Moderation fields
    status: flagStatus("status").notNull().default("open"),
    resolvedByUserId: text("resolved_by_user_id").references(() => user.id, {
      onDelete: "set null",
    }),
    resolvedAt: timestamp("resolved_at", {
      withTimezone: true,
      mode: "string",
    }),
    resolutionNotes: text("resolution_notes"),
  };
}

const taxonFlagBase = createFlagBaseColumns();
export const taxonFlagReasonCode = pgEnum("taxon_flag_reason_code", [
  "incorrect_data",
  "outdated_taxonomy",
  "duplicate_taxon",
  "problematic_media",
  "other",
]);
/**
 * Flags on taxa.
 */
export const taxonFlag = pgTable(
  "taxon_flag",
  withTimestamps({
    id: serial("id").primaryKey(),
    taxonId: integer("taxon_id")
      .notNull()
      .references(() => taxon.id, { onDelete: "cascade" }),
    reasonCode: taxonFlagReasonCode("reason_code").notNull(),

    ...taxonFlagBase,
  }),
  (t) => [
    index("taxon_flag_taxon_idx").on(t.taxonId),
    index("taxon_flag_created_by_idx").on(t.createdByUserId),
    uniqueIndex("taxon_flag_one_open_per_user_taxon_idx")
      .on(t.createdByUserId, t.taxonId)
      .where(sql`${t.status} IN ('open', 'acknowledged')`),
  ]
);

const userFlagBase = createFlagBaseColumns();
export const userFlagReasonCode = pgEnum("user_flag_reason_code", [
  "spam",
  "harassment",
  "inappropriate_profile",
  "impersonation",
  "other",
]);
/**
 * Flags on user profiles.
 */
export const userFlag = pgTable(
  "user_flag",
  withTimestamps({
    id: serial("id").primaryKey(),
    flaggedUserId: text("flagged_user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    reasonCode: userFlagReasonCode("reason_code").notNull(),

    ...userFlagBase,
  }),
  (t) => [
    index("user_flag_flagged_user_idx").on(t.flaggedUserId),
    index("user_flag_created_by_idx").on(t.createdByUserId),
    uniqueIndex("user_flag_one_open_per_user_profile_idx")
      .on(t.createdByUserId, t.flaggedUserId)
      .where(sql`${t.status} IN ('open', 'acknowledged')`),
  ]
);
