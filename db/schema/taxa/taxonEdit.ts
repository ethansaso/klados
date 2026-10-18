import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { user } from "../schema";
import { taxon } from "./taxon";

export type TaxonEditKind = (typeof TAXON_EDIT_KINDS)[number];
export const TAXON_EDIT_KINDS = [
  "created",
  "edited",
  "published",
  "archived",
] as const;
export const taxonEditKind = pgEnum("taxon_edit_kind", TAXON_EDIT_KINDS);

/** Append-only log of saves by content section. */
export const taxonEdit = pgTable(
  "taxon_edit",
  {
    id: serial("id").primaryKey(),

    taxonId: integer("taxon_id")
      .notNull()
      .references(() => taxon.id, { onDelete: "cascade" }),
    // Nulled in case of account deletion
    userId: text("user_id").references(() => user.id, {
      onDelete: "set null",
    }),

    kind: taxonEditKind("kind").notNull(),

    // Areas changed by this save
    names: boolean("names").notNull().default(false),
    taxonomy: boolean("taxonomy").notNull().default(false),
    externalIds: boolean("external_ids").notNull().default(false),
    morphology: boolean("morphology").notNull().default(false),
    media: boolean("media").notNull().default(false),
    sources: boolean("sources").notNull().default(false),
    ecology: boolean("ecology").notNull().default(false),
    notes: boolean("notes").notNull().default(false),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("taxon_edit_taxon_created_idx").on(t.taxonId, t.createdAt),
    index("taxon_edit_user_idx").on(t.userId),

    // No-op check
    check(
      "taxon_edit_edited_has_area_ck",
      sql`${t.kind} <> 'edited' OR ${t.names} OR ${t.taxonomy} OR ${t.externalIds} OR ${t.morphology} OR ${t.media} OR ${t.sources} OR ${t.ecology} OR ${t.notes}`,
    ),
  ],
);
