import { Edge } from "@xyflow/react";

/**
 * Custom override for Edge with asserted data and type.
 * Useful because React Flow unions data with 'undefined'.
 */
export type AssertedEdge<Data, Type extends string> = Omit<
  Edge,
  "data" | "type"
> & {
  type: Type;
  data: Data;
};
