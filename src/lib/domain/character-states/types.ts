/**
 * Low-level ID-based types.
 */

export type Trait = {
  id: number;
  canonicalId: number;
  label: string;
  hexCode?: string;
};

type TaxonStateBase = {
  characterId: number;
  groupId: number;
};

export type TaxonCategoricalStateDTO = TaxonStateBase & {
  kind: "categorical";
  traitValues: Trait[];
};

/**
 * TODO: Non-categorical DTOs
 */
export type TaxonCharacterStateDTO = TaxonCategoricalStateDTO | never;

/**
 * Display-oriented types for viewing/editing types.
 */

export type DisplayCharacterState = {
  kind: "categorical";
  traitValues: Trait[];
};

export type TaxonCharacterInGroup = {
  id: number;
  label: string;
  description: string;
  state: DisplayCharacterState | null;
};

export type TaxonCharacterDisplayGroupDTO = {
  id: number;
  label: string;
  description: string;
  characters: TaxonCharacterInGroup[];
};
