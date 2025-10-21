import {
  boolean,
  pgTable,
  serial,
  text,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { withTimestamps } from "../../utils/timestamps";

/**
 * Character groups (e.g., "cap", "gills").
 */
export const characterGroups = pgTable(
  "character_groups",
  withTimestamps({
    id: serial("id").primaryKey(),
    key: text("key").notNull(), // machine-stable, e.g., "cap"
    label: text("label").notNull(), // "Cap"
    description: text("description"),
    isActive: boolean("is_active").notNull().default(true),
  }),
  (t) => [uniqueIndex("character_groups_key_uq").on(t.key)]
);
