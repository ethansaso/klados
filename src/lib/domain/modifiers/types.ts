import { modifierGroup, modifierValue } from "../../../../db/schema/schema";
import type { PaginatedResult } from "../../validation/pagination";

type ModifierRow = typeof modifierValue.$inferSelect;
type ModifierGroupRow = typeof modifierGroup.$inferSelect;

export type ModifierDTO = Pick<
  ModifierRow,
  "id" | "groupId" | "value" | "description" | "affixType"
> & {
  /** Present when this value is an alias (canonicalValueId is set). */
  aliasOf: { id: number; value: string } | null;
  usageCount: number;
  /** Number of aliases pointing to this modifier (0 if this value is itself an alias). */
  aliasCount: number;
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
