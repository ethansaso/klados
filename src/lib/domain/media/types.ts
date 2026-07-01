import type { media as mediaTbl } from "../../../../db/schema/media/media";
import type { PaginatedResult } from "../../validation/pagination";

export type MediaRow = typeof mediaTbl.$inferSelect;
export type InsertMediaArgs = typeof mediaTbl.$inferInsert;

export type MediaDTO = MediaRow;

export type MediaPaginatedResult = PaginatedResult<MediaDTO>;
