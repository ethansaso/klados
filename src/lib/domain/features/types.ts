import { feature } from "../../../../db/schema/schema";
import type { PaginatedResult } from "../../validation/pagination";

export type FeatureRow = typeof feature.$inferSelect;

export type FeatureDTO = Pick<
  FeatureRow,
  "id" | "key" | "label" | "description"
> & {
  characterCount: number;
};

type BaseCharacterInFeatureDTO = {
  id: number;
  key: string;
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

export type FeatureDetailDTO = FeatureDTO & {
  characters: CharacterInFeatureDTO[];
  parentFeature: Pick<FeatureRow, "id" | "key" | "label"> | null;
  subFeatures: Pick<FeatureRow, "id" | "key" | "label">[];
};

export type FeaturePaginatedResult = PaginatedResult<FeatureDTO>;
