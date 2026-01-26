import {
  categoricalModifierGroup,
  categoricalModifierValue,
} from "../../../db/schema/schema";
import { PaginatedResult } from "../../validation/pagination";

export type ModifierRow = typeof categoricalModifierValue.$inferSelect;
export type ModifierDTO = Pick<
  ModifierRow,
  "id" | "groupId" | "value" | "description" | "affixType"
>;

export type ModifierGroupRow = typeof categoricalModifierGroup.$inferSelect;
export type ModifierGroupDTO = Pick<
  ModifierGroupRow,
  "id" | "key" | "label" | "description" | "class"
> & {
  valueCount: number;
};

export type ModifierGroupPaginatedResult = PaginatedResult<ModifierGroupDTO>;
