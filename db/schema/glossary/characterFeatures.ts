import { index, integer, pgTable, primaryKey } from "drizzle-orm/pg-core";
import { withTimestamps } from "../../utils/timestamps";
import { character } from "./characters";
import { feature } from "./features";

/** Join table for characters and features */
export const characterFeature = pgTable(
  "character_feature",
  withTimestamps({
    characterId: integer("character_id")
      .notNull()
      .references(() => character.id, { onDelete: "cascade" }),
    featureId: integer("feature_id")
      .notNull()
      .references(() => feature.id, { onDelete: "restrict" }),
  }),
  (t) => [
    primaryKey({ columns: [t.characterId, t.featureId] }),
    index("character_feature_character_idx").on(t.characterId),
    index("character_feature_feature_idx").on(t.featureId),
  ],
);
