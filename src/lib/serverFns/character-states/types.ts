type CategoricalDTO = {
  kind: "categorical";
  characterId: number;
  traitValueIds: number[];
};

export type TaxonCharacterStateDTO =
  | CategoricalDTO
  | /* TODO: Future types here */ never;
