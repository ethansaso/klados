import {
  categoricalCharacterMeta,
  character,
  numericCharacterMeta,
  unitFamily,
} from "../../../../db/schema/schema";
import type { PaginatedResult } from "../../validation/pagination";
import type { FeatureRow } from "../features/types";

export type CharacterRow = typeof character.$inferSelect;
export type CategoricalMetaRow = typeof categoricalCharacterMeta.$inferSelect;
export type NumericMetaRow = typeof numericCharacterMeta.$inferSelect;
export type UnitFamilyRow = typeof unitFamily.$inferSelect;

type BaseCharacterDTO = Pick<
  CharacterRow,
  "id" | "key" | "label" | "description"
> & {
  features: Pick<FeatureRow, "id" | "label">[];
  usageCount: number;
};

export type CategoricalCharacterDTO = BaseCharacterDTO & {
  type: "categorical";
} & Pick<CategoricalMetaRow, "characterId">;

export type NumberCharacterDTO = BaseCharacterDTO & {
  type: "number";
} & Pick<NumericMetaRow, "characterId" | "unitFamilyId">;

export type RangeCharacterDTO = BaseCharacterDTO & {
  type: "range";
} & Pick<NumericMetaRow, "characterId" | "unitFamilyId">;

export type CharacterDTO =
  | CategoricalCharacterDTO
  | NumberCharacterDTO
  | RangeCharacterDTO;

type BaseNumericCharacterDetailDTO = Omit<
  NumberCharacterDTO | RangeCharacterDTO,
  "unitFamilyId"
> & {
  unitFamily: Pick<UnitFamilyRow, "id" | "label">;
};

export type CategoricalCharacterDetailDTO = CategoricalCharacterDTO &
  Pick<CategoricalMetaRow, "isMultiSelect">;

export type NumberCharacterDetailDTO = BaseNumericCharacterDetailDTO & {
  type: "number";
};

export type RangeCharacterDetailDTO = BaseNumericCharacterDetailDTO & {
  type: "range";
};

export type CharacterDetailDTO =
  | CategoricalCharacterDetailDTO
  | NumberCharacterDetailDTO
  | RangeCharacterDetailDTO;

export type CharacterPaginatedResult = PaginatedResult<CharacterDTO>;
