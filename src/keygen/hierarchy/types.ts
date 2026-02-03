import type { TaxonCharacterStateDTO } from "../../lib/domain/states/types";
import type { TaxonHierarchyDTO } from "../../lib/domain/taxa/types";

export type HierarchyTaxonNode = TaxonHierarchyDTO & {
  states: TaxonCharacterStateDTO[];
};
