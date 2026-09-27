import type { media as mediaTbl } from "../../../../db/schema/media/media";
import type { PaginatedResult } from "../../validation/pagination";

export type MediaRow = typeof mediaTbl.$inferSelect;
export type InsertMediaArgs = typeof mediaTbl.$inferInsert;

export type MediaDTO = MediaRow;

export type MediaPaginatedResult = PaginatedResult<MediaDTO>;

/** File/content type intentionally excluded for lifecycle stability. */
export type MediaPatch = Partial<
  Pick<MediaDTO, "title" | "license" | "owner" | "source">
>;

/**
 * One uploaded item. `alreadyExisted` means the bytes hashed to a media row
 * that was already in the library, so the submitted metadata was not applied.
 */
export type UploadedMediaResult = {
  media: MediaDTO;
  alreadyExisted: boolean;
};
