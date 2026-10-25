import { sql } from "drizzle-orm";
import {
  check,
  foreignKey,
  index,
  integer,
  pgEnum,
  pgTable,
  serial,
  text,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { withTimestamps } from "../../utils/timestamps";
import { media } from "../media/media";

export type FeatureSemantics = (typeof FEATURE_SEMANTICS)[number];

/**
 * - explicit: presence/absence is meaningful
 * - variant: one alternative among its sibling variants
 * - assumed: omission is usually accidental or covered by its sub-features
 */
export const FEATURE_SEMANTICS = ["explicit", "assumed", "variant"] as const;

export const featureSemantics = pgEnum("feature_semantics", FEATURE_SEMANTICS);

export const feature = pgTable(
  "feature",
  withTimestamps({
    id: serial("id").primaryKey(),
    label: text("label").notNull(),
    description: text("description").notNull().default(""),
    parentId: integer("parent_id"),
    semantics: featureSemantics("semantics").notNull(),
    mediaId: integer("media_id").references(() => media.id, {
      onDelete: "set null",
    }),
  }),
  (t) => [
    // ? FKs here avoids circular reference causing TS problems
    foreignKey({
      name: "feature_parent_fk",
      columns: [t.parentId],
      foreignColumns: [t.id],
    }).onDelete("restrict"),

    uniqueIndex("feature_label_uq").on(t.label),
    index("feature_parent_idx").on(t.parentId),

    // A variant is an alternative among siblings; needs a parent
    check(
      "feature_variant_has_parent_ck",
      sql`${t.semantics} <> 'variant' OR ${t.parentId} IS NOT NULL`,
    ),
  ],
);
