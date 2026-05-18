import type { Node, NodeTypes } from "@xyflow/react";
import { type MediaLicense } from "../../../../db/utils/mediaLicense";
import type { AssertedEdge } from "../util/assertedEdge";
import DemoDiffNodeComponent from "./DemoDiffNodeComponent";
import DemoEdgeComponent from "./DemoEdgeComponent";
import { DemoTaxonNodeComponent } from "./DemoTaxonNodeComponent";

export type DemoMediaItem = {
  url: string;
  license: MediaLicense;
  owner: string;
  source: string;
};

export type DemoTaxonNodeData = {
  sciName: string;
  commonName?: string;
  primaryMedia?: DemoMediaItem;
};
export type DemoDiffNodeData = Record<string, unknown>;

export type DemoTaxonNode = Node<DemoTaxonNodeData, "demoTaxonNode">;
export type DemoDiffNode = Node<DemoDiffNodeData, "demoDiffNode">;

export type DemoNode = DemoTaxonNode | DemoDiffNode;

export type DemoEdgeData = {
  /** Char name to traits */
  charStates: Record<string, { label: string; hexCode?: string }[]>;
};

export type DemoEdge = AssertedEdge<DemoEdgeData, "demoEdge">;

export const demoNodeTypes = {
  demoTaxonNode: DemoTaxonNodeComponent,
  demoDiffNode: DemoDiffNodeComponent,
} satisfies NodeTypes;

export const demoEdgeTypes = {
  demoEdge: DemoEdgeComponent,
};
