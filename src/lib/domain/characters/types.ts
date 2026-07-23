import {
  categoricalCharacterMeta,
  character,
  numericCharacterMeta,
  unitFamily,
} from "../../../../db/schema/schema";
import type { PaginatedResult } from "../../validation/pagination";
import type { FeatureRow } from "../features/types";
import type { MediaDTO } from "../media/types";

export type CharacterRow = typeof character.$inferSelect;
export type CategoricalMetaRow = typeof categoricalCharacterMeta.$inferSelect;
export type NumericMetaRow = typeof numericCharacterMeta.$inferSelect;
export type UnitFamilyRow = typeof unitFamily.$inferSelect;

type BaseCharacterDTO = Pick<
  CharacterRow,
  "id" | "label" | "description" | "showInProse"
> & {
  features: Pick<FeatureRow, "id" | "label">[];
  usageCount: number;
  media: MediaDTO | null;
};

type BaseNumericCharacterDetailDTO = Omit<
  NumberCharacterDTO | RangeCharacterDTO,
  "unitFamilyId"
> & {
  unitFamily: Pick<UnitFamilyRow, "id" | "label">;
};

export type CategoricalCharacterDTO = BaseCharacterDTO & {
  type: "categorical";
} & Pick<CategoricalMetaRow, "characterId"> & {
    traitCount: number;
  };
export type CategoricalCharacterDetailDTO = Omit<
  CategoricalCharacterDTO,
  "traitCount"
> &
  Pick<CategoricalMetaRow, "isMultiSelect">;

export type NumberCharacterDTO = BaseCharacterDTO & {
  type: "number";
} & Pick<NumericMetaRow, "characterId" | "unitFamilyId">;
export type NumberCharacterDetailDTO = BaseNumericCharacterDetailDTO & {
  type: "number";
};

export type RangeCharacterDTO = BaseCharacterDTO & {
  type: "range";
} & Pick<NumericMetaRow, "characterId" | "unitFamilyId">;
export type RangeCharacterDetailDTO = BaseNumericCharacterDetailDTO & {
  type: "range";
};

export type CharacterDTO =
  | CategoricalCharacterDTO
  | NumberCharacterDTO
  | RangeCharacterDTO;

export type CharacterDetailDTO =
  | CategoricalCharacterDetailDTO
  | NumberCharacterDetailDTO
  | RangeCharacterDetailDTO;

export type CharacterType = CharacterDTO["type"];

export type CharacterPaginatedResult = PaginatedResult<CharacterDTO>;
