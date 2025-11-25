// TODO: eliminate redundancy with src/lib/utils/case.ts
export function capitalizeWord(word: string) {
  if (word.length === 0) return word;
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

export function snakeCase(str: string) {
  return (
    str
      // normalize and remove diacritics
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      // remove disallowed characters
      .replace(/[^a-zA-Z0-9\s_-]/g, "")
      // convert camelCase → snake_case
      .replace(/[A-Z]/g, (m) => `_${m.toLowerCase()}`)
      // spaces/hyphens → underscores
      .replace(/[\s-]+/g, "_")
      // collapse multiple underscores
      .replace(/_+/g, "_")
      // trim underscores and lowercase
      .replace(/^_+|_+$/g, "")
      .toLowerCase()
  );
}
