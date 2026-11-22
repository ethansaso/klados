import { getMediaUrl } from "./getMediaUrl";
import {
  isVectorMedia,
  MEDIA_SIZE_NAMES,
  type MediaDimensions,
  type MediaSize,
  mediaVariantDimensions,
  mediaVariantKey,
  type StoredMedia,
} from "./mediaSizes";

/**
 * `srcset` listing each stored size at its real width. Undefined for SVGs,
 * which scale freely.
 */
export function getMediaSrcSet(
  media: StoredMedia & MediaDimensions,
): string | undefined {
  if (isVectorMedia(media)) return undefined;

  // Small sources produce several sizes with the same width (e.g. a 300px
  // image is 300px in medium, large, and full). Only the smallest of those
  // goes in the srcset. Exception: prefer `medium` over `small` when they
  // tie, since `small` doesn't animate.
  const sizeByWidth = new Map<number, MediaSize>();
  for (const size of MEDIA_SIZE_NAMES) {
    const { width } = mediaVariantDimensions(media, size);
    const kept = sizeByWidth.get(width);
    if (!kept || kept === "small") sizeByWidth.set(width, size);
  }

  return [...sizeByWidth]
    .map(
      ([width, size]) =>
        `${getMediaUrl(mediaVariantKey(media, size))} ${width}w`,
    )
    .join(", ");
}
