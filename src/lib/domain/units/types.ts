export type UnitDTO = {
  id: number;
  familyId: number;
  key: string;
  symbol: string;
  scale: string;
};

export type UnitFamilyDTO = {
  id: number;
  label: string;
  units: UnitDTO[];
};
