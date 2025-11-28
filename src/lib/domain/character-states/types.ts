export type TaxonCategoricalStateDTO = {
  kind: "categorical";
  characterId: number;
  groupId: number;
  traitValues: { id: number; label: string }[];
};

export type TaxonCharacterStateDTO =
  | TaxonCategoricalStateDTO
  | /* TODO: Future types here */ never;
