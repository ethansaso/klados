/**
 * Derives a public URL for a media file from its storage key.
 *
 * In development (STORAGE_DRIVER=local), VITE_MEDIA_BASE_URL is unset and
 * files are served at /uploads/<key> by the dev server.
 *
 * In production (STORAGE_DRIVER=s3), set VITE_MEDIA_BASE_URL to the same value
 * as the server-side S3_PUBLIC_BASE_URL, e.g. https://media.klados.bio.
 *
 * NOTE: this is inlined into the client bundle at build time, so it must be
 * present in the environment when `vite build` runs, not just at runtime.
 */
export function getMediaUrl(storageKey: string): string {
  const base = import.meta.env.VITE_MEDIA_BASE_URL ?? "";
  return base ? `${base}/${storageKey}` : `/uploads/${storageKey}`;
}
