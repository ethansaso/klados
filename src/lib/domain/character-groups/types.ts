import { characterGroup } from "../../../db/schema/schema";
import { PaginatedResult } from "../../validation/pagination";

export type CharacterGroupRow = typeof characterGroup.$inferSelect;

export type CharacterGroupDTO = Pick<
  CharacterGroupRow,
  "id" | "key" | "label" | "description"
> & {
  characterCount: number;
};

export type CharacterInGroupDTO = {
  id: number;
  key: string;
  label: string;
  description: string;
  // TODO: number & range
  type: "categorical";
  // TODO: categorical-only; might want to use union
  traitSetId?: number;
};

export type CharacterGroupDetailDTO = CharacterGroupDTO & {
  characters: CharacterInGroupDTO[];
};

export interface CharacterGroupPaginatedResult extends PaginatedResult {
  items: CharacterGroupDTO[];
}
