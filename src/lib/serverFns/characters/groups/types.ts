import { characterGroups } from "../../../../db/schema/schema";
import { PaginatedResult } from "../../../validation/pagination";

export type CharacterGroupRow = typeof characterGroups.$inferSelect;

export type CharacterGroupDTO = Pick<
  CharacterGroupRow,
  "id" | "key" | "label" | "description"
> & {
  characterCount: number;
};

export interface CharacterGroupPaginatedResult extends PaginatedResult {
  items: CharacterGroupDTO[];
}
