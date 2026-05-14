import type { media as mediaTbl } from "../../../../db/schema/media/media";

export type MediaRow = typeof mediaTbl.$inferSelect;
export type InsertMediaArgs = typeof mediaTbl.$inferInsert;

export type MediaDTO = MediaRow;
