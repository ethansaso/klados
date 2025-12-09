import { HydratedKeyNode } from "../../../keygen/hydration/types";

export const keyNodeToRfId = (node: HydratedKeyNode): string =>
  node.kind === "taxon" ? `taxon:${node.id}` : `diff:${node.id}`;

export const branchToEdgeId = (branchId: string): string =>
  `branch:${branchId}`;
