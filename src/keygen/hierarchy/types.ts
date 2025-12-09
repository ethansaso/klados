import { TaxonCharacterStateDTO } from "../../lib/domain/character-states/types";
import { TaxonHierarchyDTO } from "../../lib/domain/taxa/types";

export type HierarchyTaxonNode = TaxonHierarchyDTO & {
  states: TaxonCharacterStateDTO[];
};
