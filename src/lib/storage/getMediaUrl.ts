import {
  type MediaSize,
  mediaVariantKey,
  type StoredMedia,
} from "./mediaSizes";

/**
 * Derives a public URL for any stored object from its key.
 *
 * In development (STORAGE_DRIVER=local), VITE_MEDIA_BASE_URL is unset and
 * files are served at /uploads/<key> by the dev server.
 *
 * In production (STORAGE_DRIVER=s3), set VITE_MEDIA_BASE_URL to the same value
 * as the server-side S3_PUBLIC_BASE_URL, e.g. https://media.klados.bio.
 */
export function getStorageUrl(key: string): string {
  const base = import.meta.env.VITE_MEDIA_BASE_URL ?? "";
  return base ? `${base}/${key}` : `/uploads/${key}`;
}

/** Public URL of one stored size of a media item. */
export function getMediaUrl(media: StoredMedia, size: MediaSize): string {
  return getStorageUrl(mediaVariantKey(media, size));
}
