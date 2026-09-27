import { getMediaUrl } from "./getMediaUrl";

/**
 * Resolves a user's stored `image` to a displayable URL. Absolute URLs (e.g.
 * supplied by an OAuth provider) pass through.
 */
export function getAvatarUrl(
  image: string | null | undefined,
): string | undefined {
  if (!image) return undefined;
  return /^https?:\/\//.test(image) ? image : getMediaUrl(image);
}
