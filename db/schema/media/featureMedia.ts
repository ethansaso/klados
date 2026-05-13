import { integer, pgTable, primaryKey, uniqueIndex } from "drizzle-orm/pg-core";
import { feature } from "../glossary/features";
import { media } from "./media";

export const featureMedia = pgTable(
  "feature_media",
  {
    featureId: integer("feature_id")
      .notNull()
      .references(() => feature.id, { onDelete: "cascade" }),
    mediaId: integer("media_id")
      .notNull()
      .references(() => media.id, { onDelete: "restrict" }),
  },
  (t) => [
    primaryKey({ name: "feature_media_pk", columns: [t.featureId, t.mediaId] }),
    uniqueIndex("feature_media_feature_uq").on(t.featureId),
  ],
);
