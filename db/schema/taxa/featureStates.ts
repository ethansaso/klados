import {
  index,
  integer,
  pgTable,
  serial,
  text,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { withTimestamps } from "../../utils/timestamps";
import { feature } from "../glossary/features";
import { taxon } from "./taxon";

/**
 * Explicit attachment of a morphological feature to a taxon.
 *
 * This encodes structural presence (e.g. "cap", "universal veil")
 * independently of any character states.
 */
export const taxonFeatureState = pgTable(
  "taxon_feature_state",
  withTimestamps({
    id: serial("id").primaryKey(),
    taxonId: integer("taxon_id")
      .notNull()
      .references(() => taxon.id, { onDelete: "cascade" }),
    featureId: integer("feature_id")
      .notNull()
      .references(() => feature.id, { onDelete: "restrict" }),
    notes: text("notes").notNull().default(""),
  }),
  (t) => [
    // A taxon can only attach a given feature once
    uniqueIndex("taxon_feature_state_taxon_feature_uq").on(
      t.taxonId,
      t.featureId,
    ),

    // ! REQUIRED FOR COMPOSITE FKs FROM STATE TABLES !
    uniqueIndex("taxon_feature_state_id_feature_uq").on(t.id, t.featureId),

    // Whether a taxon carries this feature -- helpful index for search, etc.
    index("taxon_feature_state_feature_taxon_idx").on(t.featureId, t.taxonId),
  ],
);
