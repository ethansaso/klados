import {
  foreignKey,
  index,
  integer,
  pgTable,
  serial,
  text,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { withTimestamps } from "../../utils/timestamps";

export const feature = pgTable(
  "feature",
  withTimestamps({
    id: serial("id").primaryKey(),
    key: text("key").notNull(), // machine-stable, e.g., "cap", "hymenium", "gills"
    label: text("label").notNull(),
    description: text("description").notNull().default(""),
    parentId: integer("parent_id"),
  }),
  (t) => [
    // ? FKs here avoids circular reference causing TS problems
    foreignKey({
      name: "feature_parent_fk",
      columns: [t.parentId],
      foreignColumns: [t.id],
    }).onDelete("restrict"),

    uniqueIndex("feature_key_uq").on(t.key),
    index("feature_parent_idx").on(t.parentId),
  ],
);
