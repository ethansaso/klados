import { FrontendKeyNode } from "../../../keygen/hydration/types";

export const keyNodeToRfId = (node: FrontendKeyNode): string =>
  node.kind === "taxon" ? `taxon:${node.id}` : `diff:${node.id}`;

export const branchToEdgeId = (branchId: string): string =>
  `branch:${branchId}`;
