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
import { withTimestamps } from "../../utils/timestamps";
import { user } from "../auth";
import { taxon } from "../taxa/taxon";

export const GUIDE_STATUS = ["unapproved", "pending", "approved"] as const;
export type GuideStatus = (typeof GUIDE_STATUS)[number];

const guideStatusEnum = pgEnum("guide_status", GUIDE_STATUS);

export const guide = pgTable(
  "guide",
  withTimestamps({
    id: serial("id").primaryKey(),
    authorId: text("author_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),

    // Anchor to basal taxon for this guide
    rootTaxonId: integer("root_taxon_id")
      .notNull()
      .references(() => taxon.id, { onDelete: "restrict" }),

    // Guide metadata for browsing
    name: text("name").notNull(),
    description: text("description").notNull().default(""),
    status: guideStatusEnum("status").notNull().default("unapproved"),

    // Actual tree
    tree: jsonb("tree").$type().notNull(),
  }),
  (t) => [
    index("guide_root_taxon_idx").on(t.rootTaxonId),
    index("guide_status_idx").on(t.status),
    index("guide_author_idx").on(t.authorId),
    // Prevent duplicate guide names by the same author for the same taxon
    uniqueIndex("guide_root_name_author_uq").on(
      t.rootTaxonId,
      t.name,
      t.authorId,
    ),
  ],
);
