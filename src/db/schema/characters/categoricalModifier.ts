import { pgTable, serial, text, uniqueIndex } from "drizzle-orm/pg-core";
import { withTimestamps } from "../../utils/timestamps";

export const categoricalModifier = pgTable(
  "categorical_modifier",
  withTimestamps({
    id: serial("id").primaryKey(),
    key: text("key").notNull(),
    label: text("label").notNull(),
    description: text("description").notNull().default(""),
  }),
  (t) => [uniqueIndex("categorical_modifiers_key_uq").on(t.key)],
);
