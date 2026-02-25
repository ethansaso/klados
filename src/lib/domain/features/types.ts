import { feature } from "../../../../db/schema/schema";
import type { PaginatedResult } from "../../validation/pagination";

export type FeatureRow = typeof feature.$inferSelect;

export type FeatureDTO = Pick<
  FeatureRow,
  "id" | "label" | "description" | "parentId"
> & {
  characterCount: number;
};

type BaseCharacterInFeatureDTO = {
  id: number;
  label: string;
  description: string;
};

export type CategoricalCharacterInFeatureDTO = BaseCharacterInFeatureDTO & {
  type: "categorical";
};
export type NumberCharacterInFeatureDTO = BaseCharacterInFeatureDTO & {
  type: "number";
  unitFamilyId: number;
};
export type RangeCharacterInFeatureDTO = BaseCharacterInFeatureDTO & {
  type: "range";
  unitFamilyId: number;
};

export type CharacterInFeatureDTO =
  | CategoricalCharacterInFeatureDTO
  | NumberCharacterInFeatureDTO
  | RangeCharacterInFeatureDTO;

export type FeatureDetailDTO = Omit<FeatureDTO, "parentId"> & {
  characters: CharacterInFeatureDTO[];
  parentFeature: Pick<FeatureRow, "id" | "label"> | null;
  subFeatures: Pick<FeatureRow, "id" | "label">[];
};

export type FeaturePaginatedResult = PaginatedResult<FeatureDTO>;
