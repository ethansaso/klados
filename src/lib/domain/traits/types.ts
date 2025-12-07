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
  "id" | "setId" | "key" | "label" | "isCanonical" | "hexCode"
> & {
  /** Present when this value is an alias (isCanonical = false). */
  aliasTarget: Trait | null;
};

export interface TraitSetPaginatedResult extends PaginatedResult {
  items: TraitSetDTO[];
}
export interface TraitValuePaginatedResult extends PaginatedResult {
  items: TraitValueDTO[];
}
