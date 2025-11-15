import { categoricalCharacterMeta, character } from "../../../db/schema/schema";
import { PaginatedResult } from "../../validation/pagination";
import { CharacterGroupRow } from "../character-groups/types";

export type CharacterRow = typeof character.$inferSelect;
export type CategoricalMetaRow = typeof categoricalCharacterMeta.$inferSelect;

type BaseCharacterDTO = Pick<
  CharacterRow,
  "id" | "key" | "label" | "description" | "groupId"
> & {
  group: Pick<CharacterGroupRow, "id" | "label">;
  usageCount: number;
};

export type CategoricalCharacterDTO = BaseCharacterDTO & {
  type: "categorical";
} & Pick<CategoricalMetaRow, "characterId" | "traitSetId">;

export type CharacterDTO = CategoricalCharacterDTO | never; // TODO: other types

export interface CharacterPaginatedResult extends PaginatedResult {
  items: CharacterDTO[];
}
