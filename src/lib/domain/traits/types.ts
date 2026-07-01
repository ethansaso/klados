import { categoricalTraitValue } from "../../../../db/schema/schema";
import type { PaginatedResult } from "../../validation/pagination";

export type TraitValueRow = typeof categoricalTraitValue.$inferSelect;

/** The canonical value that an alias trait points to. */
export type TraitAliasTarget = Pick<
  TraitValueRow,
  "id" | "label" | "hexCode" | "description"
>;

export type TraitValueDTO = Pick<
  TraitValueRow,
  "id" | "characterId" | "label" | "hexCode" | "description"
> & {
  /** Present when this value is an alias (canonicalValueId is set). */
  aliasOf: TraitAliasTarget | null;
  /** Number of usages of this trait (from categorical character state table) */
  usageCount: number;
  /** Number of aliases pointing to this trait (=0 if not canonical) */
  aliasCount: number;
};

export type TraitValuePaginatedResult = PaginatedResult<TraitValueDTO>;
