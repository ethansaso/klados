import { sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";

export const taxonRank = pgEnum("taxon_rank", [
  "domain",
  "kingdom",
  "phylum",
  "class",
  "subclass",
  "order",
  "family",
  "subfamily",
  "tribe",
  "genus",
  "species",
  "subspecies",
  "variety",
]);

export const nameKind = pgEnum("name_kind", [
  "scientific",
  "common",
  "synonym",
]);

export const taxa = pgTable(
  "taxa",
  {
    id: serial("id").primaryKey(),
    parentId: integer("parent_id").references(() => taxa.id),
    rank: taxonRank("rank").notNull(),
    canonical: text("canonical").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (t) => [
    index("taxa_parent_idx").on(t.parentId),
    index("taxa_canonical_idx").on(t.canonical),
  ]
);

export const names = pgTable(
  "names",
  {
    id: serial("id").primaryKey(),
    taxonId: integer("taxon_id")
      .notNull()
      .references(() => taxa.id, { onDelete: "cascade" }),
    kind: nameKind("kind").notNull(),
    value: text("value").notNull(),
    locale: varchar("locale", { length: 8 }),
    preferred: boolean("preferred").default(false),
  },
  (t) => [
    index("names_taxon_idx").on(t.taxonId),
    index("names_taxon_kind_idx").on(t.taxonId, t.kind),
    index("names_value_idx").on(t.value),
    uniqueIndex("names_preferred_unique")
      .on(t.taxonId, t.locale)
      .where(sql`preferred IS TRUE`),
  ]
);
