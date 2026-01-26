import { SITE_URL } from "./const";

export function absoluteUrl(pathOrUrl?: string) {
  if (!pathOrUrl) return undefined;
  try {
    return new URL(pathOrUrl, SITE_URL).toString();
  } catch {
    return undefined;
  }
}
