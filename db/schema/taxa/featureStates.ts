import { sql } from "drizzle-orm";
import {
  index,
  integer,
  pgEnum,
  pgTable,
  serial,
  text,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { withTimestamps } from "../../utils/timestamps";
import { feature } from "../glossary/features";
import { taxon } from "./taxon";

export type FeaturePresence = (typeof FEATURE_PRESENCES)[number];
export const FEATURE_PRESENCES = ["present", "variable", "absent"] as const;
export const featurePresence = pgEnum("feature_presence", FEATURE_PRESENCES);

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
    presence: featurePresence("presence").notNull().default("present"),

    /**
     * Generated column only extant when feature isn't flagged absent.
     * Used for FKs to ensure taxa don't end up with "stipe absent, yellow"
     */
    characterizableId: integer("characterizable_id").generatedAlwaysAs(
      sql`CASE WHEN presence = 'absent' THEN NULL ELSE id END`,
    ),
  }),
  (t) => [
    // A taxon can only attach a given feature once
    uniqueIndex("taxon_feature_state_taxon_feature_uq").on(
      t.taxonId,
      t.featureId,
    ),

    // ! REQUIRED FOR COMPOSITE FKs FROM STATE TABLES !
    uniqueIndex("taxon_feature_state_characterizable_feature_uq").on(
      t.characterizableId,
      t.featureId,
    ),

    // Whether a taxon carries this feature -- helpful index for search, etc.
    index("taxon_feature_state_feature_taxon_idx").on(t.featureId, t.taxonId),
  ],
);
