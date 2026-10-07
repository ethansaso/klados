/** Escapes special characters for SQL LIKE, so user input matches literally. */
export function escapeLike(raw: string): string {
  return raw.replace(/([%_\\])/g, "\\$1");
}

/** Escapes special characters for SQL LIKE and wraps with % for anywhere matching. */
export function likeAnywhere(q?: string): string | undefined {
  const raw = q?.trim();
  if (!raw) return undefined;

  return `%${escapeLike(raw)}%`;
}
