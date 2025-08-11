import {
  index,
  integer,
  pgEnum,
  pgTable,
  serial,
  text,
  varchar
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

export const nameKind = pgEnum("name_kind", [
  "common",
  "scientific",
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

export const names = pgTable(
  "names",
  withTimestamps({
    id: serial("id").primaryKey(),
    taxonId: integer("taxon_id")
      .notNull()
      .references(() => taxa.id, { onDelete: "cascade" }),
    kind: nameKind("kind").notNull(),
    value: text("value").notNull(),
    locale: varchar("locale", { length: 8 }),
  }),
  (t) => [
    index("names_taxon_idx").on(t.taxonId),
    index("names_taxon_locale_idx").on(t.taxonId, t.locale),
    index("names_taxon_kind_idx").on(t.taxonId, t.kind),
    index("names_value_idx").on(t.value),
  ]
);
