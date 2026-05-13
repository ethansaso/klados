import { integer, pgTable, primaryKey, uniqueIndex } from "drizzle-orm/pg-core";
import { character } from "../glossary/characters";
import { media } from "./media";

export const characterMedia = pgTable(
  "character_media",
  {
    characterId: integer("character_id")
      .notNull()
      .references(() => character.id, { onDelete: "cascade" }),
    mediaId: integer("media_id")
      .notNull()
      .references(() => media.id, { onDelete: "restrict" }),
  },
  (t) => [
    primaryKey({
      name: "character_media_pk",
      columns: [t.characterId, t.mediaId],
    }),
    uniqueIndex("character_media_character_uq").on(t.characterId),
  ],
);
