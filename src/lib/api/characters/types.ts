import { categoricalCharacterMeta, character } from "../../../db/schema/schema";
import { CharacterGroupRow } from "../../domain/character-groups/types";
import { PaginatedResult } from "../../validation/pagination";
import { TraitSetRow } from "../traits/types";

export type CharacterRow = typeof character.$inferSelect;
export type CategoricalMetaRow = typeof categoricalCharacterMeta.$inferSelect;

type BaseCharacterDTO = Pick<
  CharacterRow,
  "id" | "key" | "label" | "description"
> & {
  group: Pick<CharacterGroupRow, "id" | "label">;
  usageCount: number;
};

export type CategoricalCharacterDTO = BaseCharacterDTO & {
  type: "categorical";
} & Pick<CategoricalMetaRow, "characterId" | "traitSetId">;

export type CharacterDTO = CategoricalCharacterDTO | never; // TODO: other types

export type CategoricalCharacterDetailDTO = Omit<
  CategoricalCharacterDTO,
  "traitSetId"
> &
  Pick<CategoricalMetaRow, "isMultiSelect"> & {
    traitSet: Pick<TraitSetRow, "id" | "key" | "label" | "description">;
  };

export type CharacterDetailDTO = CategoricalCharacterDetailDTO | never; // TODO: other types

export interface CharacterPaginatedResult extends PaginatedResult {
  items: CharacterDTO[];
}
