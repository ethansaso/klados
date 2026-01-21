/**
 * Extracts search/query params from a Request as a plain object.
 * Does not parse or validate.
 */
export function getQueryParams(
  request: Request,
): Record<string, string | undefined> {
  const url = new URL(request.url);
  const query: Record<string, string | undefined> = {};
  url.searchParams.forEach((value, key) => {
    query[key] = value;
  });
  return query;
}
