import type { FeatureStateDTO } from "../../lib/domain/states/types";
import type { TaxonHierarchyDTO } from "../../lib/domain/taxa/types";

export type HierarchyTaxonNode = TaxonHierarchyDTO & {
  /** Features the taxon bears. Excludes 'absent' feature states. */
  states: FeatureStateDTO[];

  /** All features the taxon has assigned, including 'absent' states. */
  allStates: FeatureStateDTO[];
};
