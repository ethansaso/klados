import { unit, unitFamily } from "../../../../db/schema/schema";

export type UnitRow = typeof unit.$inferSelect;
export type UnitFamily = typeof unitFamily.$inferSelect;

export type UnitDTO = Pick<
  UnitRow,
  "id" | "familyId" | "key" | "symbol" | "scale"
>;

export type UnitFamilyDTO = Pick<UnitFamily, "id" | "label"> & {
  units: UnitDTO[];
};
