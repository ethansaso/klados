/** Escapes special characters for SQL LIKE and wraps with % for anywhere matching. */
export function likeAnywhere(q?: string): string | undefined {
  const raw = q?.trim();
  if (!raw) return undefined;

  const escaped = raw.replace(/([%_\\])/g, "\\$1");
  return `%${escaped}%`;
}
