import { sql } from "drizzle-orm";
import {
  check,
  foreignKey,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  serial,
  text,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { mediaLicenseEnum } from "../../utils/mediaLicense";
import { withTimestamps } from "../../utils/timestamps";

export const TAXON_RANKS_DESCENDING = [
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
] as const;

export type TaxonRank = (typeof TAXON_RANKS_DESCENDING)[number];
export const taxonRank = pgEnum("taxon_rank", TAXON_RANKS_DESCENDING);

export const TAXON_STATUSES = ["draft", "active", "deprecated"] as const;
export const taxonStatus = pgEnum("taxon_status", TAXON_STATUSES);

export const taxon = pgTable(
  "taxon",
  withTimestamps({
    id: serial("id").primaryKey(),

    parentId: integer("parent_id"),
    replacedById: integer("replaced_by_id"),

    rank: taxonRank("rank").notNull(),
    status: taxonStatus("status").notNull().default("draft"),

    sourceGbifId: integer("source_gbif_id"),
    sourceInatId: integer("source_inat_id"),

    media: jsonb("media")
      .$type<
        Array<{
          url: string;
          license?: (typeof mediaLicenseEnum.enumValues)[number];
          owner?: string;
          source?: string;
        }>
      >()
      .notNull()
      .default([]),

    notes: text("notes").notNull().default(""),
  }),
  (t) => [
    // ? FKs here avoids circular reference causing TS problems
    foreignKey({
      name: "taxa_parent_fk",
      columns: [t.parentId],
      foreignColumns: [t.id],
    }).onDelete("restrict"),
    foreignKey({
      name: "taxa_replaced_by_fk",
      columns: [t.replacedById],
      foreignColumns: [t.id],
    }).onDelete("set null"),

    check(
      "taxa_parent_not_self",
      sql`${t.parentId} IS NULL OR ${t.parentId} <> ${t.id}`
    ),
    index("taxa_parent_idx").on(t.parentId),
    index("taxa_rank_idx").on(t.rank),
    uniqueIndex("taxa_source_gbif_uq")
      .on(t.sourceGbifId)
      .where(sql`${t.sourceGbifId} IS NOT NULL`),
    uniqueIndex("taxa_source_inat_uq")
      .on(t.sourceInatId)
      .where(sql`${t.sourceInatId} IS NOT NULL`),
  ]
);
