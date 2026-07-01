export type KeyTaxonNode = {
  kind: "taxon";
  id: string;
  branches: KeyBranch[];
};

export type KeyDiffNode = {
  kind: "diff";
  id: string;
  branches: KeyBranch[];
};

export type KeyNode = KeyTaxonNode | KeyDiffNode;

/** Trait IDs + inversion flag for one character within a branch. */
export type KeyCharacterEntry = {
  traits: number[];
  inverted: boolean;
};

/**
 * Feature is asserted present; may include character-level detail.
 * Character assertions implicitly carry the presence claim, so whenever
 * characters are specified the presence field is always "present".
 */
export type PresentFeatureRationaleEntry = {
  presence: "present";
  /** characterId -> entry. Empty record is valid (presence only, no char detail). */
  characters: Record<number, KeyCharacterEntry>;
};

/** Feature is asserted absent; no character assertions are possible. */
export type AbsentFeatureRationaleEntry = {
  presence: "absent";
};

export type KeyFeatureRationaleEntry =
  | PresentFeatureRationaleEntry
  | AbsentFeatureRationaleEntry;

/**
 * Structured rationale: one or more feature-scoped assertions.
 * featureId -> entry.
 */
export type KeyRichRationale = {
  kind: "rich";
  features: Record<number, KeyFeatureRationaleEntry>;
  annotation: string | null;
};

/**
 * Human-written rationale that replaces (not supplements) structured data.
 * Used when a curator overrides a generated branch label.
 */
export type KeyWrittenRationale = {
  kind: "written";
  text: string;
};

export type KeyBranchRationale = KeyRichRationale | KeyWrittenRationale | null;

export type KeyBranch = {
  id: string;
  rationale: KeyBranchRationale;
  child: KeyNode;
};
