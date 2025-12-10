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

export const KEY_STATUS = ["unapproved", "pending", "approved"] as const;
export type KeyStatus = (typeof KEY_STATUS)[number];

const keyStatusEnum = pgEnum("key_status", KEY_STATUS);

export const dichotomousKey = pgTable(
  "dichotomous_key",
  withTimestamps({
    id: serial("id").primaryKey(),
    authorId: text("author_id").notNull(),

    // Anchor to basal taxon for this key
    rootTaxonId: integer("root_taxon_id")
      .notNull()
      .references(() => taxon.id, { onDelete: "restrict" }),

    // Key metadata for browsing
    name: text("name").notNull(),
    description: text("description").notNull().default(""),
    status: keyStatusEnum("status").notNull().default("unapproved"),

    // Actual tree
    tree: jsonb("tree").$type<KeyTaxonNode>().notNull(),
  }),
  (t) => [
    index("dichotomous_key_root_taxon_idx").on(t.rootTaxonId),
    // Prevent duplicate names for the same root taxon
    uniqueIndex("dichotomous_key_root_name_uq").on(t.rootTaxonId, t.name),
  ]
);
