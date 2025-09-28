import {
  index,
  integer,
  pgEnum,
  pgTable,
  serial,
  text,
} from "drizzle-orm/pg-core";
import { withTimestamps } from "../utils/withTimestamps";

export const taxonRank = pgEnum("taxon_rank", [
  "domain",
  "kingdom",
  "phylum",
  "class",
  "subclass",
  "superorder",
  "order",
  "family",
  "subfamily",
  "tribe",
  "genus",
  "species",
  "subspecies",
  "variety",
]);

export const taxa = pgTable(
  "taxa",
  withTimestamps({
    id: serial("id").primaryKey(),
    parentId: integer("parent_id").references(() => taxa.id),
    rank: taxonRank("rank").notNull(),
    canonical: text("canonical").notNull(),
  }),
  (t) => [
    index("taxa_parent_idx").on(t.parentId),
    index("taxa_canonical_idx").on(t.canonical),
  ]
);
