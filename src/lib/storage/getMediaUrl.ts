/**
 * Derives a public URL for a media file from its storage key.
 * If left unset,
 *
 * In development (STORAGE_DRIVER=local), VITE_MEDIA_BASE_URL is unset and
 * files are served at /uploads/<key> by the dev server.
 *
 * In production (STORAGE_DRIVER=s3), set VITE_MEDIA_BASE_URL to the bucket
 * base URL, e.g. https://my-bucket.s3.us-east-1.amazonaws.com
 * or a CloudFront distribution URL.
 */
export function getMediaUrl(storageKey: string): string {
  const base = import.meta.env.VITE_MEDIA_BASE_URL ?? "";
  return base ? `${base}/${storageKey}` : `/uploads/${storageKey}`;
}
