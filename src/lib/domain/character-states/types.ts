/**
 * Low-level ID-based types.
 */

export type Trait = {
  id: number;
  label: string;
  hexCode?: string;
};

export type TaxonCategoricalStateDTO = {
  kind: "categorical";
  characterId: number;
  groupId: number;
  traitValues: Trait[];
};

export type TaxonCharacterStateDTO =
  | TaxonCategoricalStateDTO
  | /* TODO: Future types here */ never;

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
