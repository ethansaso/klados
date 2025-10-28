import { TaxonCharacterValueDTO } from "../../../../../lib/serverFns/taxonCharacterValues";
import { create } from "zustand";

type Modifier = {};

type Character = {
  modifiers: Modifier[];
};

interface StoreData {
  draft: Character[];
  initializeCharacters: (values: TaxonCharacterValueDTO[]) => void;
}

// TODO: (immer) helpers
export const useCharacterStore = create<StoreData>((set) => ({
  draft: [],
  initializeCharacters: (values) => {
    // TODO
    const newChars = [];
    set({ draft: newChars });
  },
}));
