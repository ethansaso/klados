import { Trait } from "../../lib/domain/character-states/types";

type Weight = "light" | "regular" | "medium" | "bold";

type GenerousTrait = Omit<Trait, "hexCode"> & {
  hexCode?: string | null;
};

export type UITokenTrait = GenerousTrait & {
  weight?: Weight;
};
