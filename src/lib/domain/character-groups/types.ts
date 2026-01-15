import { characterGroup } from "../../../db/schema/schema";
import { PaginatedResult } from "../../validation/pagination";

export type CharacterGroupRow = typeof characterGroup.$inferSelect;

export type CharacterGroupDTO = Pick<
  CharacterGroupRow,
  "id" | "key" | "label" | "description"
> & {
  characterCount: number;
};

type BaseCharacterInGroupDTO = {
  id: number;
  key: string;
  label: string;
  description: string;
};

export type CategoricalCharacterInGroupDTO = BaseCharacterInGroupDTO & {
  type: "categorical";
  traitSetId: number;
};
export type NumberCharacterInGroupDTO = BaseCharacterInGroupDTO & {
  type: "number";
  unitFamilyId: number;
};
export type RangeCharacterInGroupDTO = BaseCharacterInGroupDTO & {
  type: "range";
  unitFamilyId: number;
};

export type CharacterInGroupDTO =
  | CategoricalCharacterInGroupDTO
  | NumberCharacterInGroupDTO
  | RangeCharacterInGroupDTO;

export type CharacterGroupDetailDTO = CharacterGroupDTO & {
  characters: CharacterInGroupDTO[];
};

export type CharacterGroupPaginatedResult = PaginatedResult<CharacterGroupDTO>;
