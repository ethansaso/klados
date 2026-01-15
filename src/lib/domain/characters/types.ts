import {
  categoricalCharacterMeta,
  character,
  numericCharacterMeta,
  unitFamily,
} from "../../../db/schema/schema";
import { PaginatedResult } from "../../validation/pagination";
import { CharacterGroupRow } from "../character-groups/types";
import { TraitSetRow } from "../traits/types";

export type CharacterRow = typeof character.$inferSelect;
export type CategoricalMetaRow = typeof categoricalCharacterMeta.$inferSelect;
export type NumericMetaRow = typeof numericCharacterMeta.$inferSelect;
export type UnitFamilyRow = typeof unitFamily.$inferSelect;

type BaseCharacterDTO = Pick<
  CharacterRow,
  "id" | "key" | "label" | "description"
> & {
  group: Pick<CharacterGroupRow, "id" | "label">;
  usageCount: number;
};

export type CategoricalCharacterDTO = BaseCharacterDTO & {
  type: "categorical";
} & Pick<CategoricalMetaRow, "characterId" | "traitSetId">;

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
  unitFamily: Pick<UnitFamilyRow, "id" | "label" | "description">;
};

export type CategoricalCharacterDetailDTO = Omit<
  CategoricalCharacterDTO,
  "traitSetId"
> &
  Pick<CategoricalMetaRow, "isMultiSelect"> & {
    traitSet: Pick<TraitSetRow, "id" | "key" | "label" | "description">;
  };

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
