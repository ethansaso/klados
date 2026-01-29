import {
  categoricalModifierGroup,
  categoricalModifierValue,
} from "../../../../db/schema/schema";
import type { PaginatedResult } from "../../validation/pagination";

type ModifierRow = typeof categoricalModifierValue.$inferSelect;
type ModifierGroupRow = typeof categoricalModifierGroup.$inferSelect;

export type ModifierDTO = Pick<
  ModifierRow,
  "id" | "groupId" | "value" | "description" | "affixType"
>;
export type ModifierGroupDTO = Pick<
  ModifierGroupRow,
  "id" | "key" | "label" | "description" | "class"
> & {
  valueCount: number;
};
export type ModifierGroupDetailDTO = Omit<ModifierGroupDTO, "valueCount"> & {
  values: ModifierDTO[];
};

export type ModifierGroupPaginatedResult = PaginatedResult<ModifierGroupDTO>;
