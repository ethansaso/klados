import type {
  FeaturePresence,
  FeatureSemantics,
} from "../../../../db/schema/schema";
import type { FeatureTreeNode } from "../features/types";
import type { FeatureStateDTO } from "./types";

type ResolveOptions = {
  /** Treat an unmarked Explicit feature as absent when its parent exists. */
  inferExplicitAbsence?: boolean;
  /** Features an ancestor taxon reliably bears; present unless the taxon marks them itself. */
  inheritedPresent?: ReadonlySet<number>;
};

/**
 * Inferred feature presence from marks and hierarchy. Unknown features are left out.
 * * A present or variable feature makes its ancestors present, even over an absent mark.
 * * A present variant makes its unmarked variant siblings absent.
 * * An absent feature makes its unmarked descendants absent.
 * With `inferExplicitAbsence`, an unmarked Explicit feature is absent, unless
 * its parent is unknown (e.g. under a variant with no sibling marked).
 */
export function resolvePresence(
  tree: FeatureTreeNode[],
  features: Pick<FeatureStateDTO, "featureId" | "presence">[],
  options: ResolveOptions = {},
): Map<number, FeaturePresence> {
  const { inferExplicitAbsence = false, inheritedPresent } = options;
  const byId = new Map(tree.map((node) => [node.id, node]));
  const children = new Map<number | null, FeatureTreeNode[]>();
  for (const node of tree) {
    const siblings = children.get(node.parentId) ?? [];
    siblings.push(node);
    children.set(node.parentId, siblings);
  }

  const presence = new Map<number, FeaturePresence>();
  for (const feature of features)
    presence.set(feature.featureId, feature.presence);
  for (const featureId of inheritedPresent ?? []) {
    if (!presence.has(featureId)) presence.set(featureId, "present");
  }
  if (presence.size === 0) return presence;

  for (const [featureId, status] of [...presence]) {
    if (status === "absent") continue;
    let ancestorId = byId.get(featureId)?.parentId ?? null;
    while (ancestorId !== null) {
      if (presence.get(ancestorId) !== "variable") {
        presence.set(ancestorId, "present");
      }
      ancestorId = byId.get(ancestorId)?.parentId ?? null;
    }
  }

  for (const node of tree) {
    if (node.semantics !== "variant" || presence.get(node.id) !== "present") {
      continue;
    }
    for (const sibling of children.get(node.parentId) ?? []) {
      if (sibling.semantics === "variant" && !presence.has(sibling.id)) {
        presence.set(sibling.id, "absent");
      }
    }
  }

  // Presumed: unmarked Assumed feature under existing parent. Still allows Explicit children to default to absent in inferExplicitAbsence case. See fillBelow.
  function defaultFor(
    semantics: FeatureSemantics,
    parent: FeaturePresence | "presumed" | undefined,
  ): FeaturePresence | "presumed" | undefined {
    if (parent === "absent") return "absent";
    if (parent === undefined) return undefined;
    if (semantics === "assumed") return "presumed";
    if (semantics === "explicit" && inferExplicitAbsence) return "absent";
    return undefined;
  }

  // Roots behave as if under a present parent
  function fillBelow(
    parentId: number | null,
    parent: FeaturePresence | "presumed" | undefined,
  ) {
    for (const child of children.get(parentId) ?? []) {
      const marked = presence.get(child.id);
      const status = marked ?? defaultFor(child.semantics, parent);
      if (status !== undefined && status !== "presumed") {
        presence.set(child.id, status);
      }
      fillBelow(child.id, status);
    }
  }
  fillBelow(null, "present");

  return presence;
}
