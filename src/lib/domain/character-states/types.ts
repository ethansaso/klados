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
