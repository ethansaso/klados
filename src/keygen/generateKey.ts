import { getTaxonCharacterStates } from "../lib/domain/character-states/service";
import { TaxonCharacterStateDTO } from "../lib/domain/character-states/types";

export const generateKeyForTaxa = async (ids: number[]): Promise<void> => {
  // Instantiate ID -> data map
  const taxonDataMap: Map<number, TaxonCharacterStateDTO[]> = new Map();

  for (const id of ids) {
    const taxonData = await getTaxonCharacterStates({ taxonId: id });
    if (taxonData) {
      taxonDataMap.set(id, taxonData);
    }
  }
};
