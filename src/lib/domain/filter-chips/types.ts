/**
 * Display text for one filter token.
 * `label` is null when the token names glossary entries that no longer exist.
 */
export type FilterChip = {
  key: string;
  label: string | null;
};
