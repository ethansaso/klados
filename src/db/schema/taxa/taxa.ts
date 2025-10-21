import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  serial,
  text,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { mediaLicense } from "../../utils/mediaLicense";
import { withTimestamps } from "../../utils/timestamps";

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
    parentId: integer("parent_id").references(() => taxa.id, {
      onDelete: "restrict",
    }),

    rank: taxonRank("rank").notNull(),

    sourceGbifId: integer("source_gbif_id"),
    sourceInatId: integer("source_inat_id"),

    media: jsonb("media").$type<
      Array<{
        url: string;
        license?: (typeof mediaLicense.enumValues)[number];
        owner?: string;
        source?: string;
      }>
    >(),

    notes: text("notes"),
  }),
  (t) => [
    check(
      "taxa_parent_not_self",
      sql`${t.parentId} IS NULL OR ${t.parentId} <> ${t.id}`
    ),

    // Common lookups/filters
    index("taxa_parent_idx").on(t.parentId),
    index("taxa_rank_idx").on(t.rank),

    // Provenance indexing
    uniqueIndex("taxa_source_gbif_uq")
      .on(t.sourceGbifId)
      .where(sql`${t.sourceGbifId} IS NOT NULL`),
    uniqueIndex("taxa_source_inat_uq")
      .on(t.sourceInatId)
      .where(sql`${t.sourceInatId} IS NOT NULL`),
  ]
);
