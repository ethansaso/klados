import { KeyNode } from "../../../../../keygen/key-building/types";

export const keyNodeToRfId = (node: KeyNode): string =>
  node.kind === "taxon" ? `taxon:${node.id}` : `diff:${node.id}`;

export const branchToEdgeId = (branchId: string): string =>
  `branch:${branchId}`;
