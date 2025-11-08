import {
  categoricalOptionSets,
  categoricalOptionValues,
} from "../../../../db/schema/schema";
import { PaginatedResult } from "../../../validation/pagination";

export type OptionSetRow = typeof categoricalOptionSets.$inferSelect;
export type OptionValueRow = typeof categoricalOptionValues.$inferSelect;

export type OptionSetDTO = Pick<
  OptionSetRow,
  "id" | "key" | "label" | "description"
> & {
  valueCount: number;
};
export type OptionSetDetailDTO = OptionSetDTO & {
  /** Characters referencing this set */
  usedByCharacters: number;
};
export type OptionValueDTO = Pick<
  OptionValueRow,
  "id" | "setId" | "key" | "label" | "isCanonical"
> & {
  /** Present when this value is an alias (isCanonical = false). */
  aliasTarget: { id: number; label: string } | null;
};

export interface OptionSetPaginatedResult extends PaginatedResult {
  items: OptionSetDTO[];
}
