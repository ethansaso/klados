export type MediaSize = keyof typeof MEDIA_SIZES;

/** What's needed to locate a media item's stored files. */
export type StoredMedia = { storageKey: string; contentType: string };

/** Source dimensions after EXIF orientation. */
export type MediaDimensions = { width: number; height: number };

const SVG_CONTENT_TYPE = "image/svg+xml";

/**
 * Long-edge pixel caps; images are never upscaled.
 * Sorted in ascending order of size.
 */
export const MEDIA_SIZES = {
  small: 256,
  medium: 512,
  large: 1024,
  full: 2048,
} as const;
export const MEDIA_SIZE_NAMES = Object.keys(MEDIA_SIZES) as MediaSize[];

export function isVectorMedia(media: Pick<StoredMedia, "contentType">) {
  return media.contentType === SVG_CONTENT_TYPE;
}

/**
 * Gets the full object string for a media file.
 * SVGs are stored once, so every size resolves to the same key.
 */
export function mediaVariantKey(media: StoredMedia, size: MediaSize): string {
  return isVectorMedia(media)
    ? `${media.storageKey}.svg`
    : `${media.storageKey}/${size}.webp`;
}

/**
 * Every stored object string for a media item.
 * Sorted in ascending order of size.
 */
export function mediaVariantKeys(media: StoredMedia): string[] {
  return [...new Set(MEDIA_SIZE_NAMES.map((s) => mediaVariantKey(media, s)))];
}

/** Width and height of a stored file for one size, computed from source dimensions. */
export function mediaVariantDimensions(
  { width, height }: MediaDimensions,
  size: MediaSize,
): MediaDimensions {
  const scale = Math.min(1, MEDIA_SIZES[size] / Math.max(width, height));
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}
