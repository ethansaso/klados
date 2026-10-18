import {
  foreignKey,
  index,
  integer,
  pgTable,
  primaryKey,
} from "drizzle-orm/pg-core";
import { taxonFeatureState } from "../taxa/featureStates";
import { taxonSource } from "./taxonSource";

/** Citation for a feature. Will safely delete when source is deleted. */
export const taxonFeatureSource = pgTable(
  "taxon_feature_source",
  {
    taxonId: integer("taxon_id").notNull(),
    featureId: integer("feature_id").notNull(),
    sourceId: integer("source_id").notNull(),
  },
  (t) => [
    primaryKey({
      name: "taxon_feature_source_pk",
      columns: [t.taxonId, t.featureId, t.sourceId],
    }),
    foreignKey({
      name: "taxon_feature_source_feature_fk",
      columns: [t.taxonId, t.featureId],
      foreignColumns: [taxonFeatureState.taxonId, taxonFeatureState.featureId],
    }).onDelete("cascade"),
    foreignKey({
      name: "taxon_feature_source_source_fk",
      columns: [t.taxonId, t.sourceId],
      foreignColumns: [taxonSource.taxonId, taxonSource.sourceId],
    }).onDelete("cascade"),

    index("taxon_feature_source_source_idx").on(t.taxonId, t.sourceId),
  ],
);
