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
import { media } from "../media/media";

export const feature = pgTable(
  "feature",
  withTimestamps({
    id: serial("id").primaryKey(),
    label: text("label").notNull(),
    description: text("description").notNull().default(""),
    parentId: integer("parent_id"),
    mediaId: integer("media_id").references(() => media.id, {
      onDelete: "set null",
    }),
  }),
  (t) => [
    // ? FKs here avoids circular reference causing TS problems
    foreignKey({
      name: "feature_parent_fk",
      columns: [t.parentId],
      foreignColumns: [t.id],
    }).onDelete("restrict"),

    uniqueIndex("feature_label_uq").on(t.label),
    index("feature_parent_idx").on(t.parentId),
  ],
);
