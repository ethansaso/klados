import {
  index,
  integer,
  pgTable,
  serial,
  text,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { withTimestamps } from "../../utils/timestamps";
import { taxon } from "../taxa/taxon";

export const dichotomousKey = pgTable(
  "dichotomous_key",
  withTimestamps({
    id: serial("id").primaryKey(),

    // Anchor to basal taxon for this key
    rootTaxonId: integer("root_taxon_id")
      .notNull()
      .references(() => taxon.id, { onDelete: "restrict" }),

    name: text("name").notNull(),
    description: text("description").notNull().default(""),
  }),
  (t) => [
    index("dichotomous_key_root_taxon_idx").on(t.rootTaxonId),
    // Prevent duplicate names for the same root taxon
    uniqueIndex("dichotomous_key_root_name_uq").on(t.rootTaxonId, t.name),
  ]
);
