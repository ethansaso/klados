export const INAT_API_URL = "https://api.inaturalist.org/v1";
/** Openly licensed photos; `static.inaturalist.org` hosts the rest. */
export const INAT_OPEN_DATA_HOST = "inaturalist-open-data.s3.amazonaws.com";

/**
 * `.../photos/{id}/medium.jpg` → `.../photos/{id}/original.jpg`, for Open Data
 * photos only; null otherwise.
 */
export function mediumToOpenDataOriginalUrl(mediumUrl: string): string | null {
  let url: URL;
  try {
    url = new URL(mediumUrl);
  } catch {
    return null;
  }
  if (url.hostname !== INAT_OPEN_DATA_HOST) return null;
  const pathname = url.pathname.replace(/\/medium(\.\w+)$/, "/original$1");
  if (pathname === url.pathname) return null;
  url.pathname = pathname;
  return url.toString();
}
