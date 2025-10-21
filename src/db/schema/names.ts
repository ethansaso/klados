import {
  index,
  integer,
  pgEnum,
  pgTable,
  serial,
  text,
  varchar
} from "drizzle-orm/pg-core";
import { withTimestamps } from "../utils/timestamps";
import { taxa } from "./taxa/taxa";

export const nameKind = pgEnum("name_kind", [
  "common",
  "scientific",
]);

export const names = pgTable(
  "names",
  withTimestamps({
    id: serial("id").primaryKey(),
    taxonId: integer("taxon_id")
      .notNull()
      .references(() => taxa.id, { onDelete: "cascade" }),
    kind: nameKind("kind").notNull(),
    value: text("value").notNull(),
    locale: varchar("locale", { length: 8 }),
  }),
  (t) => [
    index("names_taxon_idx").on(t.taxonId),
    index("names_taxon_locale_idx").on(t.taxonId, t.locale),
    index("names_taxon_kind_idx").on(t.taxonId, t.kind),
    index("names_value_idx").on(t.value),
  ]
);