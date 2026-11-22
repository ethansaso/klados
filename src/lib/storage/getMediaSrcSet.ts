import { getMediaUrl } from "./getMediaUrl";
import {
  isVectorMedia,
  MEDIA_SIZE_NAMES,
  type MediaDimensions,
  type MediaSize,
  mediaVariantDimensions,
  type StoredMedia,
} from "./mediaSizes";

/**
 * `srcset` listing each stored size at its real width. Undefined for SVGs,
 * which scale freely.
 *
 * With `coverAspect` (the box's width / height), each size is instead listed at
 * the widest such box it can fill when cover-cropped, so browsers don't pick a
 * landscape file too short for a square tile.
 */
export function getMediaSrcSet(
  media: StoredMedia & MediaDimensions,
  coverAspect?: number,
): string | undefined {
  if (isVectorMedia(media)) return undefined;

  // Small sources produce several sizes with the same width (e.g. a 300px
  // image is 300px in medium, large, and full). Only the smallest of those
  // goes in the srcset. Exception: prefer `medium` over `small` when they
  // tie, since `small` doesn't animate.
  const sizeByWidth = new Map<number, MediaSize>();
  for (const size of MEDIA_SIZE_NAMES) {
    const { width, height } = mediaVariantDimensions(media, size);
    const listed = coverAspect
      ? Math.min(width, Math.round(height * coverAspect))
      : width;
    const kept = sizeByWidth.get(listed);
    if (!kept || kept === "small") sizeByWidth.set(listed, size);
  }

  return [...sizeByWidth]
    .map(([width, size]) => `${getMediaUrl(media, size)} ${width}w`)
    .join(", ");
}
