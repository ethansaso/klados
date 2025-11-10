import { pgTable, serial, text, uniqueIndex } from "drizzle-orm/pg-core";
import { withTimestamps } from "../../utils/timestamps";

/**
 * Character groups (e.g., "cap", "gills").
 */
export const characterGroup = pgTable(
  "character_group",
  withTimestamps({
    id: serial("id").primaryKey(),
    key: text("key").notNull(), // machine-stable, e.g., "cap"
    label: text("label").notNull(), // "Cap"
    description: text("description"),
  }),
  (t) => [uniqueIndex("character_groups_key_uq").on(t.key)]
);
