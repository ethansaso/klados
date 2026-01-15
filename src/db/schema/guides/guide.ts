import {
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  serial,
  text,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { KeyTaxonNode } from "../../../keygen/key-building/types";
import { withTimestamps } from "../../utils/timestamps";
import { taxon } from "../taxa/taxon";

export const GUIDE_STATUS = ["unapproved", "pending", "approved"] as const;
export type GuideStatus = (typeof GUIDE_STATUS)[number];

const guideStatusEnum = pgEnum("guide_status", GUIDE_STATUS);

export const guide = pgTable(
  "guide",
  withTimestamps({
    id: serial("id").primaryKey(),
    authorId: text("author_id").notNull(),

    // Anchor to basal taxon for this guide
    rootTaxonId: integer("root_taxon_id")
      .notNull()
      .references(() => taxon.id, { onDelete: "restrict" }),

    // Guide metadata for browsing
    name: text("name").notNull(),
    description: text("description").notNull().default(""),
    status: guideStatusEnum("status").notNull().default("unapproved"),

    // Actual tree
    tree: jsonb("tree").$type<KeyTaxonNode>().notNull(),
  }),
  (t) => [
    index("guide_root_taxon_idx").on(t.rootTaxonId),
    // Prevent duplicate names for the same root taxon
    uniqueIndex("guide_root_name_uq").on(t.rootTaxonId, t.name),
  ]
);
