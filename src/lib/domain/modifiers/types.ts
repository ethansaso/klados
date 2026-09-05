import { modifierGroup, modifierValue } from "../../../../db/schema/schema";
import type { PaginatedResult } from "../../validation/pagination";
import type { MediaDTO } from "../media/types";

type ModifierRow = typeof modifierValue.$inferSelect;
type ModifierGroupRow = typeof modifierGroup.$inferSelect;

export type ModifierDTO = Pick<
  ModifierRow,
  "id" | "groupId" | "label" | "description" | "affixType"
> & {
  usageCount: number;
  media: MediaDTO | null;
};
export type ModifierGroupDTO = Pick<
  ModifierGroupRow,
  "id" | "label" | "description"
> & {
  valueCount: number;
};
export type ModifierGroupDetailDTO = Omit<ModifierGroupDTO, "valueCount">;

export type ModifierGroupPaginatedResult = PaginatedResult<ModifierGroupDTO>;
export type ModifierPaginatedResult = PaginatedResult<ModifierDTO>;
