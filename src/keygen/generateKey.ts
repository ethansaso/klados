import { TaxonDetailDTO } from "../lib/domain/taxa/types";

export const generateKeyForTaxa = async (ids: number[]): Promise<void> => {
  // Instantiate ID -> data map
  const taxonDataMap: Map<number, TaxonDetailDTO> = new Map();

  for (const id of ids) {
  }
};
