import type { FeatureSemantics } from "../../../../db/schema/schema";

/**
 * Display text for one filter token.
 * `label` is null when the token names glossary entries that no longer exist.
 */
export type FilterChip = {
  key: string;
  label: string | null;
  /** The feature the token names; null when it names none. */
  feature: { label: string; semantics: FeatureSemantics } | null;
};
