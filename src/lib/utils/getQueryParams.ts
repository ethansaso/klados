import { defaultParseSearch } from "@tanstack/react-router";

/**
 * Extracts search/query params from a Request as a plain object, 
 * decoded identically to TanStack router for consistency. Does not
 * validate on its own.
 */
export function getQueryParams(request: Request): Record<string, unknown> {
  return defaultParseSearch(new URL(request.url).search);
}
