import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  numeric,
  pgTable,
  serial,
  text,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { withTimestamps } from "../../utils/timestamps";

/**
 * Unit families (a.k.a. dimensions): length, area, mass, etc.
 */
export const unitFamily = pgTable(
  "unit_family",
  withTimestamps({
    id: serial("id").primaryKey(),
    label: text("label").notNull(),
  }),
  (t) => [uniqueIndex("unit_families_label_uq").on(t.label)]
);

/**
 * Units within a family.
 *
 * Conversion into the family base unit:
 *   base = input * scale
 */
export const unit = pgTable(
  "unit",
  withTimestamps({
    id: serial("id").primaryKey(),
    familyId: integer("family_id")
      .notNull()
      .references(() => unitFamily.id, { onDelete: "restrict" }),
    key: text("key").notNull(), // e.g. "um", "in", "kg" (should be lowercase)
    symbol: text("symbol").notNull(), // e.g. µm, "in", "kg"

    // Numeric ensures e.g. 0.0254 is exact
    scale: numeric("scale", { precision: 30, scale: 18 }).notNull(),
  }),
  (t) => [
    uniqueIndex("units_family_symbol_uq").on(t.familyId, t.symbol),
    uniqueIndex("units_family_key_uq").on(t.familyId, t.key),
    index("units_family_idx").on(t.familyId),

    // scale must be > 0
    check("units_scale_positive_ck", sql`${t.scale} > 0`),
  ]
);
