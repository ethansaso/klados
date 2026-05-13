import { index, integer, pgTable, primaryKey } from "drizzle-orm/pg-core";
import { taxon } from "../taxa/taxon";
import { media } from "./media";

export const taxonMedia = pgTable(
  "taxon_media",
  {
    taxonId: integer("taxon_id")
      .notNull()
      .references(() => taxon.id, { onDelete: "cascade" }),
    mediaId: integer("media_id")
      .notNull()
      .references(() => media.id, { onDelete: "restrict" }),
    position: integer("position").notNull().default(0),
  },
  (t) => [
    primaryKey({ name: "taxon_media_pk", columns: [t.taxonId, t.mediaId] }),
    index("taxon_media_taxon_idx").on(t.taxonId, t.position),
  ],
);
