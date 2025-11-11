import {
  categoricalTraitSet,
  categoricalTraitValue,
} from "../../../db/schema/schema";
import { PaginatedResult } from "../../validation/pagination";

export type TraitSetRow = typeof categoricalTraitSet.$inferSelect;
export type TraitValueRow = typeof categoricalTraitValue.$inferSelect;

export type TraitSetDTO = Pick<
  TraitSetRow,
  "id" | "key" | "label" | "description"
> & {
  valueCount: number;
  canonicalCount: number;
  usedByCharacters: number;
};
export type TraitSetDetailDTO = TraitSetDTO & {};
export type TraitValueDTO = Pick<
  TraitValueRow,
  "id" | "setId" | "key" | "label" | "isCanonical"
> & {
  /** Present when this value is an alias (isCanonical = false). */
  aliasTarget: { id: number; label: string } | null;
};

export interface TraitSetPaginatedResult extends PaginatedResult {
  items: TraitSetDTO[];
}
