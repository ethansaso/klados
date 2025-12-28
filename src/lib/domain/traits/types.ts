import {
  categoricalTraitSet,
  categoricalTraitValue,
} from "../../../db/schema/schema";
import { PaginatedResult } from "../../validation/pagination";
import { Trait } from "../character-states/types";

export type TraitSetRow = typeof categoricalTraitSet.$inferSelect;
export type TraitSetDTO = Pick<
  TraitSetRow,
  "id" | "key" | "label" | "description"
> & {
  valueCount: number;
  canonicalCount: number;
  usedByCharacters: number;
};
export type TraitSetDetailDTO = TraitSetDTO & {};

export type TraitValueRow = typeof categoricalTraitValue.$inferSelect;
export type TraitValueDTO = Pick<
  TraitValueRow,
  "id" | "setId" | "key" | "label" | "hexCode" | "description"
> & {
  /** Present when this value is an alias (isCanonical = false). */
  aliasTarget: Trait | null;
  /** Number of usages of this trait (from categorical character state table) */
  usageCount: number;
  /** Number of aliases pointing to this trait (=0 if not canonical) */
  aliasCount: number;
};

export type TraitSetPaginatedResult = PaginatedResult<TraitSetDTO>;
export type TraitValuePaginatedResult = PaginatedResult<TraitValueDTO>;
